import { useState, useEffect } from 'react';
import Recorder from '../utilities/recorder';

const { URL, Promise, navigator } = window;
const AudioContext = window.AudioContext || window.webkitAudioContext;

const useRecorder = (options) => {
  const [recorder, setRecorder] = useState();
  const [finishedRecording, setFinishedRecording] = useState(false);
  const [isRecording, setIsRecording] = useState();
  const [audioBlob, setAudioBlob] = useState();
  const [audioURL, setAudioURL] = useState();

  const getAudio = async () => {
    if (!recorder) {
      throw new Error('Recorder not initialized');
    }

    return new Promise(() => {
      recorder.exportWAV((blob) => {
        setAudioBlob(blob);
        setAudioURL(URL.createObjectURL(blob));
      });
    });
  };

  const createNewRecorder = async (stream, newAudioContext) => {
    const input = newAudioContext?.createMediaStreamSource(stream);
    const newRecorder = new Recorder(input, options);
    setRecorder(newRecorder);
  };

  const setup = async () => {
    const newAudioContext = new AudioContext();

    await navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      createNewRecorder(stream, newAudioContext);
    });
  };

  const resetRecorder = () => {
    setIsRecording(false);

    recorder.stop();
  };

  const stop = async () => {
    if (!isRecording) {
      return;
    }

    resetRecorder();
    setFinishedRecording(true);
  };

  const start = async () => {
    if (!recorder) {
      await setup();
    }
    await recorder?.clear();

    setIsRecording(true);
  };

  useEffect(() => {
    if (isRecording && recorder) {
      recorder.record();
    }
  }, [isRecording, recorder]);

  useEffect(() => {
    if (finishedRecording) {
      getAudio();
      setFinishedRecording(false);
    }
  }, [finishedRecording]);

  return { audioBlob, audioURL, isRecording, setup, start, stop, getAudio };
};

export default useRecorder;
