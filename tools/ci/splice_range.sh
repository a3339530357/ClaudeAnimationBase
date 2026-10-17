#!/usr/bin/env bash
# splice_range.sh: put a re-rendered stretch back into the finished film, frame-exact, keeping the film's own audio.
# For small fixes (the opening credits of 《写不完的温柔》 were changed twice): render only that stretch in the cloud with
#   gh workflow run render.yml -f range=A:B -f segments=8   ->   gh run download <id> -n video -D out/dl_part
# then:  bash tools/ci/splice_range.sh out/dl_part/mv.mp4 out/final/片名.mp4 A B out/final/片名_new.mp4
#   part.mp4 must start at A (the workflow's range output does); A, B in seconds, 30 fps. Re-encodes the video once
#   (libx264 crf 16, same colour tags as the workflow); the audio is copied from the old film untouched.
set -euo pipefail
PART=$1; FULL=$2; A=$3; B=$4; OUT=$5
F0=$(python3 -c "print(round($A * 30))"); F1=$(python3 -c "print(round($B * 30))")
echo "frames $F0..$((F1 - 1)) from $PART, the rest from $FULL"
ffmpeg -v error -y -i "$FULL" -i "$PART" -filter_complex \
  "[0:v]trim=end_frame=$F0,setpts=PTS-STARTPTS[a];[1:v]trim=end_frame=$((F1 - F0)),setpts=PTS-STARTPTS[p];[0:v]trim=start_frame=$F1,setpts=PTS-STARTPTS[b];[a][p][b]concat=n=3:v=1:a=0[v]" \
  -map "[v]" -map 0:a -c:a copy -c:v libx264 -preset medium -crf 16 -pix_fmt yuv420p \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv -r 30 -movflags +faststart "$OUT"
ffprobe -v error -show_entries format=duration:stream=codec_name,nb_frames -of compact "$OUT"
