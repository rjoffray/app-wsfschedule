#!/bin/bash -e

VER="2.1.0"
REPO="oaklabs/app-wsfschedule"

FULL_TAG=$REPO:$VER

docker build -t $FULL_TAG -f Dockerfile $(pwd)

if [[ $# -lt 2 && $1 == "push" ]]; then
  docker push $FULL_TAG
fi

