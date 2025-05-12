# 3CX Audio UX

Open Source Firefox Extension (WebExtension) that adds audio recording, sending, and a modern, consistent audio player to the 3CX chat.

## ✨ Features

- **Integrated audio recording:** Record voice messages directly in the 3CX chat with a modern floating window and intuitive controls (pause, resume, cancel, send).
- **Preview before sending:** Listen to your recorded audio before sending, with a custom player and action buttons.
- **Custom audio player:** All sent and received audios in the chat are displayed with a beautiful, responsive, and consistent player, including:
  - Microphone icon
  - Sender’s name (first name only)
  - Custom progress bar
  - Large, accessible play/pause button
  - Elapsed and total time
  - Volume icon
- **Supports .webm, .ogg, and .m4a audio files**
- **Responsive design, fully integrated with 3CX**
- **Does not alter the original chat layout:** The message input and buttons always remain visible.

## 🖼️ Preview

![Custom player preview](./screenshot.png)

## 🚀 Installation

1. Download or clone this repository:
   ```bash
   git clone https://github.com/your-username/3cx-audio-ux.git
   ```
2. In Firefox, go to `about:debugging` > "This Firefox" > "Load Temporary Add-on".
3. Select the `manifest.json` file from the project folder.
4. Done! The audio record button will appear in your 3CX chat.

## ⚙️ How it works

- The record button is automatically injected into the 3CX chat bar.
- When recording, a floating window shows the timer, controls, and animation.
- After stopping, you can listen, send, or cancel the audio.
- All audios (sent and received) are displayed with the custom player, showing the sender’s first name (extracted from the 3CX DOM).
- The layout is responsive and does not interfere with native chat buttons.

## 📝 License

This project is licensed under the MIT License.  
See the [LICENSE](./LICENSE) file for more details.

## 🤝 Contributing

Contributions are very welcome!  
Open an issue or submit a pull request to suggest improvements, report bugs, or add new features.

## 🙏 Acknowledgements

- [3CX](https://www.3cx.com/) for the great chat system.
- [Mozilla WebExtensions](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions) for the modern extension framework.

---

**Developed with ❤️ by [Your Name or GitHub Username]**
