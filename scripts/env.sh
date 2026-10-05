#!/usr/bin/env bash
# 환경 이름(dev|prod) → Supabase 프로젝트 ref. 다른 스크립트가 source 해서 쓴다.
case "${1:-}" in
  prod) PROJECT_REF=kabcpknnqmbowueoklrz ;;
  dev) PROJECT_REF=musbctrurxvtalwqpxlk ;;
  *) echo "환경을 지정해 주세요: dev 또는 prod" >&2; exit 1 ;;
esac
export PROJECT_REF
export SUPABASE_URL="https://${PROJECT_REF}.supabase.co"
