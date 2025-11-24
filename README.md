[日本語の説明はこちら (Click here for Japanese)](#ai-zork---日本語-japanese)

# AI Zork: The Interactive Fiction Saga

An AI-powered reimagining of the classic text adventure trilogy: **Zork I**, **Zork II**, and **Zork III**, plus a chaos-infused **Zork Remix** mode.

This project uses Google's **Gemini 2.5 Flash** as a Game Master to simulate the logic, narrative, and puzzles of the Great Underground Empire, while **Gemini 2.5 Flash Image** generates retro-style visualizations in real-time.

It features a high-fidelity retro terminal interface with CRT effects, 8-channel chiptune music, and an auto-mapping system.

## ✨ Key Features

*   **Complete Saga Support**: Play through the environments of **Zork I**, **Zork II**, and **Zork III**.
*   **ZORK REMIX Mode**: A unique "Randomizer" mode that fuses elements, items, and puzzles from all three games into a generated, unpredictable adventure.
*   **AI Game Master**: Powered by Google Gemini 2.5 Flash. It tracks inventory, location coordinates, and narrative tone faithfully.
*   **Visual Imagination**: Uses `gemini-2.5-flash-image` to generate dark, atmospheric 8-bit style scenes for key events.
*   **Auto-Mapping System**: A "Fog of War" style map that automatically records your path on a grid as you explore the 3D coordinates of the world.
*   **Adaptive Audio Engine**:
    *   **8-Voice Polyphony**: Custom Web Audio API engine capable of rich chiptune composition.
    *   **Dynamic BGM**: Over 30 unique tracks that change based on the game version and current mood (Exploration, Battle, Dungeon, Title, etc.).
    *   **Procedural SFX**: Real-time synthesized sound effects.
*   **Bilingual Support**: Toggle between **English** and **Japanese** instantly without losing progress.
*   **Rich Retro UI**:
    *   CRT scanlines, curvature, and glow effects (Toggleable).
    *   Monitor bezel and background grid.
    *   Font size adjustment (S/M/L).
*   **Save & Load**: 5 slots with metadata to save your journey.
*   **Mobile Optimized**: Responsive design with touch-friendly controls and slide-out status panel.

## 📜 Credits & Acknowledgements

This project is an AI simulation inspired by the classic Infocom titles.
Original source code references used for context:

*   **Zork I**: [https://github.com/historicalsource/zork1](https://github.com/historicalsource/zork1)
*   **Zork II**: [https://github.com/historicalsource/zork2](https://github.com/historicalsource/zork2)
*   **Zork III**: [https://github.com/historicalsource/zork3](https://github.com/historicalsource/zork3)

## 🛠️ Tech Stack

*   **Frontend**: React 19, TypeScript
*   **Styling**: Tailwind CSS
*   **AI Models**: `gemini-2.5-flash`, `gemini-2.5-flash-image`
*   **Audio**: Native Web Audio API (No external assets)

## 🚀 How to Run

1.  **Clone the repository**
2.  **API Key Configuration**:
    You need a valid Google Gemini API Key available in `process.env.API_KEY`.
3.  **Install Dependencies**:
    ```bash
    npm install
    ```
4.  **Start the Server**:
    ```bash
    npm start
    ```

---

<a id="ai-zork---日本語-japanese"></a>

# AI Zork: The Interactive Fiction Saga (日本語版)

伝説のテキストアドベンチャー三部作 **Zork I**、**Zork II**、**Zork III**、そしてカオスな **Zork Remix** モードをAIの力で現代に蘇らせたプロジェクトです。

Googleの **Gemini 2.5 Flash** がゲームマスターとして振る舞い、広大な地下帝国の論理と物語をシミュレートします。さらに、**Gemini 2.5 Flash Image** がシーンの情景をリアルタイムに画像生成します。

CRTモニターの質感を再現したリッチなUI、8和音のチップチューンBGM、オートマッピングシステムを搭載しています。

## ✨ 主な機能

*   **三部作完全対応**: **Zork I** (The Great Underground Empire)、**Zork II** (The Wizard of Frobozz)、**Zork III** (The Dungeon Master) の世界を選択してプレイ可能。
*   **ZORK REMIX モード**: 3つのゲームのマップ、アイテム、敵、パズルをAIがランダムに融合させる、予測不能な「ランダマイザー」モード。
*   **オートマッピング**: プレイヤーが移動した座標を記録し、グリッドマップ上に自動で作図していく「オートマッピング（Fog of War）」システム。
*   **適応型オーディオエンジン**:
    *   **8和音ポリフォニック**: Web Audio APIで構築された、厚みのあるレトロサウンドエンジン。
    *   **ダイナミックBGM**: ゲームのバージョンや現在の雰囲気（探索、戦闘、ダンジョン、タイトルなど）に合わせて切り替わる30曲以上の書き下ろしBGM。
*   **動的な画像生成**: 重要なシーンをレトロなピクセルアート風に可視化。
*   **日英言語切り替え**: 進行状況を維持したまま、英語と日本語をリアルタイムに切り替え可能。
*   **リッチなレトロUI**:
    *   CRT走査線、湾曲、発光エフェクト（ON/OFF可能）。
    *   没入感を高めるモニターベゼルと背景。
    *   フォントサイズ変更機能 (S/M/L)。
*   **セーブ＆ロード**: 5つのセーブスロットを完備。
*   **モバイル対応**: スマホでも快適に遊べるレスポンシブデザイン。

## 📜 クレジット・謝辞

本プロジェクトはInfocomの名作にインスパイアされたAIシミュレーションです。
オリジナル版のソースコードは以下を参照しています：

*   **Zork I**: [https://github.com/historicalsource/zork1](https://github.com/historicalsource/zork1)
*   **Zork II**: [https://github.com/historicalsource/zork2](https://github.com/historicalsource/zork2)
*   **Zork III**: [https://github.com/historicalsource/zork3](https://github.com/historicalsource/zork3)

## 🛠️ 使用技術

*   **フロントエンド**: React 19, TypeScript
*   **スタイル**: Tailwind CSS
*   **AIモデル**: `gemini-2.5-flash`, `gemini-2.5-flash-image`
*   **オーディオ**: Web Audio API (外部素材不使用)

## 🚀 実行方法

1.  **リポジトリをクローン**
2.  **APIキーの設定**:
    Google Gemini APIキー (`process.env.API_KEY`) が必要です。
3.  **依存関係のインストール**:
    ```bash
    npm install
    ```
4.  **起動**:
    ```bash
    npm start
    ```
