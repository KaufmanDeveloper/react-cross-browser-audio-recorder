import { useState, useEffect } from 'react';
import Recorder from '../utilities/recorder';

const { URL, Blob, Promise, navigator, FileReader, AudioContext } = window;

const useRecorder = () => {
  const [recorder, setRecorder] = useState();
  const [audioContext, setAudioContext] = useState();
  const [audioTimeout, setAudioTimeout] = useState();
  const [rejectPromise, setRejectPromise] = useState();
  const [isRecording, setIsRecording] = useState();
  const [recordingTime, setRecordingTime] = useState();
  const [audioBlob, setAudioBlob] = useState();
  const [audioURL, setAudioURL] = useState();

  const audioElementType = 'audio/wav';
  const audioElementID = 'audio-playback';

  const createNewRecorder = async (stream) => {
    if (audioContext) {
      console.log(audioContext);
      const input = audioContext.createMediaStreamSource(stream);
      const newRecorder = new Recorder(input);
      setRecorder(newRecorder);
    }
  };

  const setup = async () => {
    if (!audioContext) {
      setAudioContext(new AudioContext());
    }

    return navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      createNewRecorder(stream);
    });
  };

  const start = async () => {
    await setup();

    // this.set('isRecording', true);
    setIsRecording(true);
    recorder.record();

    return (
      recordingTime &&
      new Promise((resolve, reject) => {
        let finish = () => resolve(this.stop());
        let audioTimeout = later(finish, recordingTime);

        this.set('audioTimeout', audioTimeout);
        this.set('resolvePromise', resolve);
        this.set('rejectPromise', reject);
      })
    );
  };

  return { audioBlob, audioURL, isRecording, setup };
};

export default useRecorder;
