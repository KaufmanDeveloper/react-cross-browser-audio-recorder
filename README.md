# react-cross-browser-audio-recorder

React hook that utilizes [Recorder JS](https://github.com/mattdiamond/Recorderjs).

This provides a react hook that can be used to record, play, and export audio as a wav file across all browsers and playable on all operating systems.

<!-- [Demo](put link here) -->

## Installation

```
npm install react-cross-browser-audio-recorder
```

## Example usage

```
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
```

### Options

- numChannels: (Default: 2)
  - 2 numChannels records 2 channel sound, setting to 1 will allow you to record in mono
