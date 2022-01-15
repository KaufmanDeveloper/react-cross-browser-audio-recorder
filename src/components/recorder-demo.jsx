import React, { useEffect } from 'react';
import useRecorder from '../hooks/useRecorder';

function RecorderDemo() {
  const { audioURL, setup, start } = useRecorder();

  return (
    <div>
      <button onClick={setup} type="button">
        Setup Audio Recorder
      </button>

      <button onClick={start} type="button">
        Start
      </button>

      <audio src={audioURL} controls>
        <track default kind="captions" srcLang="en" src={audioURL} />
        Sorry, your browser does not support embedded audio.
      </audio>
    </div>
  );
}

export default RecorderDemo;
