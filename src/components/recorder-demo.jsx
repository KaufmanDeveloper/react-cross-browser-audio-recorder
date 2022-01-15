import React from 'react';
import useRecorder from '../hooks/useRecorder';

function RecorderDemo() {
  const { audioURL } = useRecorder();

  return (
    <audio src={audioURL} controls>
      <track default kind="captions" srcLang="en" src={audioURL} />
      Sorry, your browser does not support embedded audio.
    </audio>
  );
}

export default RecorderDemo;
