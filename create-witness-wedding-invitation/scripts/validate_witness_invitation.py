#!/usr/bin/env python3
"""Validate a generated witness-mode invitation."""
from __future__ import annotations
import argparse,json,re
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse

def main():
  parser=argparse.ArgumentParser(description=__doc__);parser.add_argument("directory",type=Path);args=parser.parse_args();root=args.directory.resolve();errors=[];warnings=[]
  for name in ("index.html","styles.css","witness.css","witness.js","config.js","invitation.json","assets/paper-warm.jpg","assets/og-witness-letter.png","materials.html","assets/NOTICES.txt"):
    if not (root/name).is_file():errors.append(f"missing required file: {name}")
  if errors:return report(errors,warnings)
  try:data=json.loads((root/"invitation.json").read_text(encoding="utf-8"))
  except Exception as exc:return report([f"invalid invitation.json: {exc}"],warnings)
  for path,value in (("couple.groom",data.get("couple",{}).get("groom")),("couple.bride",data.get("couple",{}).get("bride")),("event.date",data.get("event",{}).get("date")),("event.time",data.get("event",{}).get("time")),("event.venue",data.get("event",{}).get("venue"))):
    if not isinstance(value,str) or not value.strip():errors.append(f"missing required text: {path}")
  if type(data.get("couple",{}).get("brideFirst")) is not bool:errors.append("couple.brideFirst must be explicitly set from the user's chosen name order")
  try:
    event_datetime=datetime.fromisoformat(data.get("event",{}).get("datetime",""))
    if event_datetime.utcoffset() is None:errors.append("event.datetime needs an explicit offset")
    displayed_clock=re.search(r"(\d{1,2}):(\d{2})",data.get("event",{}).get("time", ""))
    if displayed_clock and (int(displayed_clock.group(1)),int(displayed_clock.group(2))) != (event_datetime.hour,event_datetime.minute):
      errors.append("event.time disagrees with event.datetime")
  except Exception:errors.append("event.datetime must be valid ISO 8601")
  recipient=data.get("recipient",{});paragraphs=recipient.get("paragraphs",[])
  if type(recipient.get("verifyName")) is not bool:errors.append("recipient.verifyName must be a boolean")
  if recipient.get("verifyName") and not recipient.get("name"):errors.append("recipient.name is required when verifyName is true")
  if not isinstance(paragraphs,list) or not paragraphs or any(not isinstance(x,str) or not x.strip() for x in paragraphs):errors.append("recipient.paragraphs must contain text")
  media=data.get("media",{});paths=[media.get("share",""),media.get("music",""),media.get("missionProof",""),media.get("accepted","")]+[value for x in media.get("gallery",[]) if isinstance(x,dict) for value in (x.get("src",""),x.get("largeSrc",""))]
  for value in filter(None,paths):
    target=(root/value).resolve()
    try:target.relative_to(root)
    except ValueError:errors.append(f"media path escapes site: {value}");continue
    if not target.is_file():errors.append(f"missing media: {value}")
  if not media.get("gallery"):warnings.append("gallery has no supplied photos; placeholder will be shown")
  html=(root/"index.html").read_text(encoding="utf-8")
  if 'href="./materials.html"' not in html:errors.append("missing accessible music/material attribution link")
  notices=(root/"assets/NOTICES.txt").read_text(encoding="utf-8")
  if "严禁商用" not in notices or "授权状态未确认" not in notices:errors.append("original-material non-commercial and unverified-authorization notice is incomplete")
  warnings.append("original witness materials: commercial use prohibited; authorization unverified")
  if type(data.get("privacy",{}).get("noindex")) is not bool:errors.append("privacy.noindex must be a boolean")
  for field in ("og:title","og:description","og:image"):
    if not re.search(rf'<meta\s+property=["\']{re.escape(field)}["\']\s+content=["\'][^"\']+["\']',html):errors.append(f"missing static {field} metadata")
  share_match=re.search(r'<meta\s+property=["\']og:image["\']\s+content=["\']([^"\']+)',html)
  if share_match:
    share_image=share_match.group(1)
    if share_image.endswith("placeholder.svg"):warnings.append("share image remains a placeholder; use the bundled envelope or an approved replacement before final sharing")
    if urlparse(share_image).scheme!="https":warnings.append("og:image needs a public absolute HTTPS URL before WeChat sharing")
  script=(root/"witness.js").read_text(encoding="utf-8")
  for required in ('data-passphrase-open','data-passphrase-form','name="passphrase"','data-passphrase-result'):
    if required not in html:errors.append(f"missing hidden passphrase easter egg: {required}")
  if "百无禁忌" not in script:errors.append("missing hidden passphrase success path")
  for forbidden in ('name="companions"','name="message"','data-rsvp-form','id="witness-ticket"','id="witness-rsvp"'):
    if forbidden in html:errors.append(f"effect-only RSVP must not contain form field: {forbidden}")
  return report(errors,warnings)
def report(errors,warnings):
  for x in errors:print("ERROR:",x)
  for x in warnings:print("WARNING:",x)
  print("Validation failed." if errors else f"Validation passed with {len(warnings)} warning(s).")
  return 1 if errors else 0
if __name__=="__main__":raise SystemExit(main())
