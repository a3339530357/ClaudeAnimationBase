#!/usr/bin/env bash
# 本地播放器用的音乐：原曲 + 结尾回声（和云端成片用同一份 render/music_tail.txt），输出 assets/music_tail.m4a（不进 git）
# 用法（在项目根目录）: bash render/bake_audio.sh（render/music_tail.txt 里的时间是示例那首歌的，换歌要改）
set -euo pipefail
cd "$(dirname "$0")/.."
F="$(tr -d '\n' < render/music_tail.txt)"
ffmpeg -y -loglevel error -f lavfi -t 0.1 -i anullsrc=r=44100:cl=stereo -i assets/music.m4a -filter_complex "$F" -map '[full]' -c:a aac -b:a 192k assets/music_tail.m4a
ffprobe -v error -show_entries format=duration -of csv=p=0 assets/music_tail.m4a
