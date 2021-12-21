#!/bin/bash
TG_AGENT_URL=""
curl -O $TG_AGENT_URL
tar xf tiangong-agent.tar.gz
cd tiangong-agent
bash ./install.sh $1
