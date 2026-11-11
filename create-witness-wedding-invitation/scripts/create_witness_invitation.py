#!/usr/bin/env python3
"""Create a personalized witness-mode static wedding invitation."""
from __future__ import annotations
import argparse, json, shutil
from copy import deepcopy
from html import escape
from pathlib import Path
from urllib.parse import urljoin, urlparse

DEFAULTS = {
  "recipient": {"name":"亲友","verifyName":False,"stamp":"Witness","greeting":"亲爱的 {name}：","paragraphs":["谢谢你一直以来的陪伴与支持。那些一起笑过、聊过、走过的日子，已经悄悄变成我们故事里很重要的一部分。","因为在我们的人生旅程里，你曾留下属于你的那一圈涟漪。","所以今天，我们想邀请你继续见证下一章节。"],"signature":""},
  "copy": {"coverTitle":"一封神秘的来信","coverNote":"这封信，仅限本人亲启。","galleryTitle":"爱的放映厅","galleryIntro":"灯光暗下，胶片开始转动。那些酷酷的、明亮的、烟火里的瞬间，连成一段关于我们的短片。"},
  "mission": {"number":"WITNESS-001","role":"婚礼见证官","timeline":[],"items":["见证我们的誓言","分享我们的幸福","留下属于你的笑容"]},
  "privacy":{"noindex":True},
  "media": {"share":"","music":None,"missionProof":"","accepted":"","gallery":[]}
}

RELATION_TEMPLATES = Path(__file__).resolve().parent.parent/"references"/"relation-letters.json"
ALLOWED_FIELDS = {
  "": {"couple", "event", "recipient", "copy", "mission", "privacy", "media", "sharing"},
  "couple": {"groom", "bride", "brideFirst"},
  "event": {"datetime", "date", "time", "venue", "address", "dresscode"},
  "recipient": {"name", "verifyName", "relationship", "letterCode", "stamp", "greeting", "paragraphs", "signature"},
  "copy": {"coverTitle", "coverNote", "galleryTitle", "galleryIntro"},
  "mission": {"number", "role", "timeline", "items"},
  "mission.timeline[]": {"time", "label"},
  "privacy": {"noindex"},
  "media": {"share", "music", "missionProof", "accepted", "gallery"},
  "media.gallery[]": {"src", "largeSrc", "title", "caption", "alt", "wide"},
  "sharing": {"url"},
}

def reject_unknown_fields(data):
  def check(value, location):
    if not isinstance(value, dict):raise ValueError(f"{location or 'configuration'} must be an object")
    unexpected=set(value)-ALLOWED_FIELDS[location]
    if unexpected:raise ValueError(f"unsupported field at {location or 'configuration'}: {', '.join(sorted(unexpected))}")
  check(data, "")
  for section in ("couple", "event", "recipient", "copy", "mission", "privacy", "media", "sharing"):
    if section in data:check(data[section], section)
  for section, values in (("mission.timeline[]", data.get("mission",{}).get("timeline",[])), ("media.gallery[]", data.get("media",{}).get("gallery",[]))):
    if not isinstance(values,list):raise ValueError(f"{section} must be a list")
    for value in values:check(value, section)

def choose_letter(recipient, supplied_recipient):
  templates=json.loads(RELATION_TEMPLATES.read_text(encoding="utf-8"))
  raw_code=supplied_recipient.get("letterCode")
  raw_relationship=supplied_recipient.get("relationship")
  code=""
  custom_relationship=""
  if raw_code is not None and str(raw_code).strip():
    value=str(raw_code).strip()
    code=value.zfill(2) if value.isdecimal() and len(value)<=2 else value
    if code not in templates:
      print(f"WARNING: unknown relationship code {value!r}; using general letter (00)")
      code="00"
  if raw_relationship is not None and str(raw_relationship).strip():
    relationship=str(raw_relationship).strip()
    matches=[key for key,item in templates.items() if item["relationship"]==relationship]
    if not matches:
      if not supplied_recipient.get("paragraphs"):raise ValueError(f"unknown relationship {relationship!r}: provide recipient.paragraphs for a custom letter")
      if code and code!="00":raise ValueError("custom recipient.relationship requires the general letter code (00) or no code")
      code="00"
      custom_relationship=relationship
    else:
      if code and code!=matches[0]:raise ValueError("recipient.relationship and recipient.letterCode disagree")
      code=matches[0]
  code=code or "00"
  template=templates[code]
  recipient["letterCode"]=code
  recipient["relationship"]=custom_relationship or template["relationship"]
  for key in ("stamp","greeting","paragraphs"):
    if key not in supplied_recipient:recipient[key]=deepcopy(template[key])

def merge(base, incoming):
  result=deepcopy(base)
  for key,value in incoming.items():
    result[key]=merge(result[key],value) if isinstance(value,dict) and isinstance(result.get(key),dict) else value
  return result

def copy_media(config, source_dir, output, music_omitted):
  target=output/"assets"/"user"; target.mkdir(parents=True,exist_ok=True); used=set()
  def one(value,label):
    if not value:return ""
    source=(source_dir/value).resolve() if not Path(value).is_absolute() else Path(value).resolve()
    if not source.is_file():raise ValueError(f"Missing {label}: {source}")
    allowed={".mp3",".m4a",".ogg",".wav"} if label=="media.music" else {".jpg",".jpeg",".png",".webp",".avif",".gif"}
    if source.suffix.lower() not in allowed:raise ValueError(f"Unsupported {label} file type: {source.suffix}")
    name=source.name; stem,suffix=source.stem,source.suffix; index=2
    while name in used:name=f"{stem}-{index}{suffix}";index+=1
    used.add(name);shutil.copy2(source,target/name);return f"./assets/user/{name}"
  media=config["media"]
  media["share"]=one(media.get("share", ""),"media.share")
  media["missionProof"]=one(media.get("missionProof", ""),"media.missionProof")
  media["accepted"]=one(media.get("accepted", ""),"media.accepted")
  if not music_omitted:media["music"]=one(media.get("music", ""),"media.music")
  else:media["music"]="./assets/classic-bgm.mp3"
  for i,item in enumerate(media.get("gallery",[])):
    item["src"]=one(item.get("src",""),f"media.gallery[{i}].src")
    if item.get("largeSrc"):item["largeSrc"]=one(item["largeSrc"],f"media.gallery[{i}].largeSrc")

def main():
  parser=argparse.ArgumentParser(description=__doc__);parser.add_argument("--config",required=True,type=Path);parser.add_argument("--output",required=True,type=Path);args=parser.parse_args()
  config_path=args.config.resolve();output=args.output.resolve()
  if output.exists():parser.error(f"output already exists: {output}")
  try:
    supplied=json.loads(config_path.read_text(encoding="utf-8"));reject_unknown_fields(supplied);config=merge(DEFAULTS,supplied)
    choose_letter(config["recipient"],supplied.get("recipient",{}))
    couple=config.get("couple",{})
    if type(couple.get("brideFirst")) is not bool:raise ValueError("couple.brideFirst must be explicitly set from the user's chosen name order")
    names=[couple.get("bride"),couple.get("groom")] if couple["brideFirst"] else [couple.get("groom"),couple.get("bride")];couple["names"]=" & ".join(x for x in names if x)
    if not config["recipient"].get("signature"):config["recipient"]["signature"]=f"{couple['names']} 敬邀"
    template=Path(__file__).resolve().parent.parent/"assets"/"witness-template";shutil.copytree(template,output)
    supplied_media=supplied.get("media",{}) if isinstance(supplied.get("media",{}),dict) else {};copy_media(config,config_path.parent,output,"music" not in supplied_media)
    payload=json.dumps(config,ensure_ascii=False,indent=2).replace("</","<\\/")
    config_js=output/"config.js"
    config_template=config_js.read_text(encoding="utf-8")
    start_marker="/* WITNESS_CONFIG_START */"
    end_marker="/* WITNESS_CONFIG_END */"
    if config_template.count(start_marker) != 1 or config_template.count(end_marker) != 1:
      raise ValueError("template config markers are missing or duplicated")
    before, remainder=config_template.split(start_marker,1)
    _, after=remainder.split(end_marker,1)
    config_js.write_text(f"{before}{start_marker}\n{payload}\n{end_marker}{after}",encoding="utf-8")
    (output/"invitation.json").write_text(json.dumps(config,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    html=(output/"index.html").read_text(encoding="utf-8");title=f"{couple['names']} · 见证者婚礼邀请";description=f"{config['event']['date']} {config['event']['time']}，{config['event']['venue']}。一封等待亲启的婚礼来信。";image=config["media"].get("share") or "./assets/og-witness-letter.png"
    public_url=config.get("sharing",{}).get("url","")
    if public_url:
      parsed=urlparse(public_url)
      if parsed.scheme!="https" or not parsed.netloc:raise ValueError("sharing.url must be an absolute HTTPS URL")
      image=urljoin(public_url.rstrip("/")+"/",image)
    html=html.replace("<title>见证者模式 · 婚礼邀请</title>",f"<title>{escape(title)}</title>").replace('content="一封等待见证者亲启的婚礼来信"',f'content="{escape(description,quote=True)}"').replace('content="见证者模式 · 婚礼邀请"',f'content="{escape(title,quote=True)}"').replace('content="./assets/og-witness-letter.png"',f'content="{escape(image,quote=True)}"')
    if config["privacy"].get("noindex") is False:html=html.replace('content="noindex,nofollow"','content="index,follow"')
    (output/"index.html").write_text(html,encoding="utf-8")
  except Exception as exc:
    if output.exists():shutil.rmtree(output)
    print(f"error: {exc}");return 1
  print(f"Created witness invitation: {output}");return 0
if __name__=="__main__":raise SystemExit(main())
