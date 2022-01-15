import { useState, useEffect } from 'react';
import Recorder from '../utilities/recorder';

const { URL, Blob, Promise, navigator, FileReader, AudioContext } = window;

const useRecorder = () => {
  const [recorder, setRecorder] = useState();
  const [audioContext, setAudioContext] = useState();
  const [audioBlob, setAudioBlob] = useState();
  const [audioURL, setAudioURL] = useState();

  const audioElementType = 'audio/wav';

  const createNewRecorder = async (stream) => {
    const input = audioContext.createMediaStreamSource(stream);
    const newRecorder = new Recorder(input);
    setRecorder(newRecorder);
  };

  const setup = async () => {
    if (!audioContext) {
      setAudioContext(new AudioContext());
    }

    return navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      createNewRecorder(stream);
    });
  };

  useEffect(() => {}, []);

  return { audioBlob, audioURL, setup };
};

export default useRecorder;
