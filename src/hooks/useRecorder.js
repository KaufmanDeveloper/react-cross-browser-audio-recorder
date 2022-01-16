import { useState, useEffect } from 'react';
import Recorder from '../utilities/recorder';

const { URL, Promise, navigator, AudioContext } = window;

const useRecorder = (options) => {
  const [recorder, setRecorder] = useState();
  const [finishedRecording, setFinishedRecording] = useState(false);
  const [audioTimeout, setAudioTimeout] = useState();
  const [resolvePromise, setResolvePromise] = useState();
  const [rejectPromise, setRejectPromise] = useState();
  const [isRecording, setIsRecording] = useState();
  const [recordingTime, setRecordingTime] = useState(options?.recordingTime || 5000);
  const [audioBlob, setAudioBlob] = useState();
  const [audioURL, setAudioURL] = useState();

  const getAudio = async () => {
    if (!recorder) {
      throw new Error('Recorder not initialized');
    }

    return new Promise((resolve) => {
      recorder.exportWAV((blob) => {
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

    recorder.stop();
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
    if (isRecording && recorder && recordingTime) {
      recorder.record();

      // eslint-disable-next-line no-unused-expressions
      // Promise((resolve, reject) => {
      //   const finish = () => resolve(stop());
      //   if (audioTimeout <= recordingTime) {
      //     finish();
      //     return;
      //   }

      //   setAudioTimeout(audioTimeout);
      //   setResolvePromise(resolve);
      //   setRejectPromise(reject);
      // });
    }
  }, [isRecording, recorder, recordingTime]);

  useEffect(() => {
    if (finishedRecording) {
      getAudio();
      setFinishedRecording(false);
    }
  }, [finishedRecording]);

  return { audioBlob, audioURL, isRecording, setup, start, stop };
};

export default useRecorder;
