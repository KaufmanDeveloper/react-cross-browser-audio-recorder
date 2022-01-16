import React from 'react';
import useRecorder from '../hooks/useRecorder';

function RecorderDemo() {
  const options = { numChannels: 1 };
  const { audioURL, isRecording, start, stop } = useRecorder(options);

  return (
    <div>
      <button onClick={start} disabled={isRecording} type="button">
        Start
      </button>

      <audio src={audioURL} controls type="audio/wav">
        <track default kind="captions" srcLang="en" src={audioURL} />
        Sorry, your browser does not support embedded audio.
      </audio>

      <button onClick={stop} disabled={!isRecording} type="button">
        Stop
      </button>
    </div>
  );
}

export default RecorderDemo;
