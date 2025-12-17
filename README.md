**ANSI101** is a modern, interactive debugger and visualizer for ANSI escape sequences, inspired by [regex101](https://regex101.com). It allows users to input raw strings containing ANSI codes and see a detailed breakdown of each sequence, along with a live preview of how the text would appear in a terminal.

## 🚀 Features

* **Real-time Parsing:** Instantly breaks down raw strings into Text, CSI sequences, and visual attributes.
* **Deep Analysis:**
    * Supports standard ANSI colors (30-37).
    * Supports **256-color** palette (`38;5;n`).
    * Supports **TrueColor** RGB (`38;2;r;g;b`).
    * Identifies Cursor movements, Erase modes, and Private modes (`?25h`).
* **Visual Preview:** Renders the actual colored output exactly as a terminal would.
* **Smart Sidebar:** A collapsible, "timeline-style" breakdown of every token and parameter.

## 🛠 Tech Stack

* **Framework:** [Next.js 16](https://nextjs.org/) 
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **Styling:** [Tailwind CSS v4.0](https://tailwindcss.com/)
* **Icons:** [Lucide React](https://lucide.dev/)

## 🏃‍♂️ Getting Started

### Prerequisites

* Node.js 18+ installed

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/codecrafters-io/ansi101.git
    cd ansi101
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

4.  **Open your browser:**
    Navigate to [http://localhost:3000](http://localhost:3000) to see the app.
