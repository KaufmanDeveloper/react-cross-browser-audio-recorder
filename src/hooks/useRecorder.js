import { useState, useEffect } from 'react';
import Recorder from '../utilities/recorder';

const { URL, Blob, Promise, navigator, FileReader, AudioContext } = window;

const useRecorder = () => {
  const [recorder, setRecorder] = useState();
  const [finishedRecording, setFinishedRecording] = useState(false);
  const [audioContext, setAudioContext] = useState();
  const [audioTimeout, setAudioTimeout] = useState();
  const [resolvePromise, setResolvePromise] = useState();
  const [rejectPromise, setRejectPromise] = useState();
  const [isRecording, setIsRecording] = useState();
  const [recordingTime, setRecordingTime] = useState();
  const [audioBlob, setAudioBlob] = useState();
  const [audioURL, setAudioURL] = useState();

  const audioElementType = 'audio/wav';
  const audioElementID = 'audio-playback';

  const getAudio = async () => {
    if (!recorder) {
      throw new Error('Recorder not initialized');
    }

    return new Promise((resolve) => {
      recorder.exportWAV((blob) => {
        console.log(blob);
        setAudioBlob(blob);
        setAudioURL(URL.createObjectURL(blob));
      });
    });
  };

  const createNewRecorder = async (stream, newAudioContext) => {
    const input = newAudioContext?.createMediaStreamSource(stream);
    const newRecorder = new Recorder(input);
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
    setAudioTimeout(null);
    setRejectPromise(null);
    setResolvePromise(null);

    recorder?.stop();
  };

  const stop = async () => {
    if (!isRecording) {
      return;
    }

    // eslint-disable-next-line no-unused-expressions
    resolvePromise && resolvePromise();
    // eslint-disable-next-line no-unused-expressions
    audioTimeout && setAudioTimeout(null);

    resetRecorder();
    // this.set('finishedRecording', true);
    // this.set('finishedRecording', false);
    setFinishedRecording(true);
    setFinishedRecording(false);
  };

  const start = async () => {
    await setup();
    console.log(recorder);

    setIsRecording(true);
    recorder.record();

    return (
      recordingTime &&
      new Promise((resolve, reject) => {
        const finish = () => resolve(stop());
        if (audioTimeout <= recordingTime) {
          finish();
          return;
        }

        setAudioTimeout(audioTimeout);
        setResolvePromise(resolve);
        setRejectPromise(reject);
      })
    );
  };

  useEffect(() => {
    if (finishedRecording) {
      getAudio();
    }
  }, ['finishedRecording']);

  return { audioBlob, audioURL, isRecording, setup, start, stop };
};

export default useRecorder;
