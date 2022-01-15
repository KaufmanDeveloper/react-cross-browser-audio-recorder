import { useState, useEffect } from 'react';
import recorder from '../utilities/recorder';

const useRecorder = () => {
  const [audioBlob, setAudioBlob] = useState();
  const [audioURL, setAudioURL] = useState();

  useEffect(() => {}, []);

  return { audioBlob, audioURL };
};

export default useRecorder;
