# Gnomes at Night Maze Generator

A web application for generating custom cooperative mazes for the [Gnomes at Night](https://boardgamegeek.com/boardgame/205766/gnomes-at-night) board game. Each maze has two sides with different wall patterns - players must work together to navigate!

## Features

- **Multiple Difficulty Levels**: Four preset difficulties (A-D) with increasing complexity
- **Custom Configuration**: Fine-tune wall density, cooperation requirements, and room sizes
- **Dual-Sided Mazes**: Generates asymmetric wall patterns for cooperative gameplay
- **PDF Export**: Download print-ready 10.25" x 10.25" PDFs for double-sided printing
- **Visual Preview**: Real-time SVG rendering of both maze sides
- **Reproducible Seeds**: Share maze seeds for consistent generation

## How It Works

In Gnomes at Night, two players each see one side of a double-sided maze board. Players must communicate to guide a shared piece to collect treasures, but each player can only see walls on their side. This generator creates mazes where:

- **Side A and Side B have different walls** - creating the need for cooperation
- **All cells are reachable** via cooperative movement
- **Treasures are strategically placed** in cells requiring communication
- **Cooperation score** measures how much players need to work together

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/allisonwhilden/gnomes-at-night-maze-generator.git
cd gnomes-at-night-maze-generator

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3005](http://localhost:3005) to use the generator.

### Building for Production

```bash
npm run build
npm start
```

## Usage

1. **Select Difficulty**: Choose from levels A (easiest) to D (hardest), or use Custom mode
2. **Generate**: Click "Generate New Maze" to create a new maze
3. **Preview**: View both sides of the maze in the preview panel
4. **Download**: Click "Download PDF" to get a print-ready file

### Difficulty Levels

| Level | Wall Density | Cooperation | Max Room Size | Description |
|-------|-------------|-------------|---------------|-------------|
| A | 35% | 20% | 45 cells | Beginner - open spaces, easy navigation |
| B | 45% | 25% | 35 cells | Intermediate - more walls, moderate cooperation |
| C | 50% | 25% | 30 cells | Advanced - complex paths |
| D | 55% | 30% | 30 cells | Expert - dense walls, high cooperation |

### Custom Configuration

- **Wall Density** (0-100%): Percentage of possible internal walls that exist
- **Min Cooperation Score** (0-100%): Minimum asymmetry between sides
- **Asymmetry Factor** (0-100%): How different the two sides should be
- **Max Room Size**: Largest allowed contiguous open area (smaller = harder)

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Main application page
├── components/
│   ├── maze/
│   │   ├── DifficultySelector.tsx  # Difficulty controls
│   │   ├── MazeCanvas.tsx          # SVG maze renderer
│   │   └── MazePreview.tsx         # Side-by-side preview
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── maze/
│   │   ├── constants.ts    # Configuration and assets
│   │   ├── flood-fill.ts   # Reachability algorithms
│   │   ├── generator.ts    # Maze generation logic
│   │   ├── random.ts       # Seeded random number generator
│   │   ├── treasures.ts    # Treasure placement
│   │   ├── types.ts        # TypeScript definitions
│   │   └── validator.ts    # Maze validation & cooperation analysis
│   └── pdf/
│       └── generator.ts    # PDF export with jsPDF
└── public/
    ├── background.png      # Maze background texture
    ├── objects/            # Treasure images
    └── walls/              # Wall segment images
```

## Architecture

### Maze Generation Algorithm

1. **Wall Generation**: Creates all possible internal walls, then assigns each to Side A, Side B, both, or neither based on density and asymmetry settings

2. **Validation**: Ensures the maze is:
   - Fully connected via cooperative movement
   - Meets minimum cooperation requirements
   - Has appropriately sized rooms (not too large or small)

3. **Treasure Placement**: Distributes 12 treasures (6 per side) prioritizing cells that require cooperation to reach

4. **Retry Logic**: If validation fails, regenerates with a new seed (up to 500 attempts)

### Key Algorithms

- **Flood Fill**: BFS-based reachability analysis for single-side and cooperative movement
- **Cooperation Analysis**: Categorizes cells by which side(s) can reach them
- **Room Detection**: Identifies contiguous open areas for size validation
- **Spatial Indexing**: O(1) wall lookups using normalized wall keys

## Printing

The PDF generator creates 10.25" x 10.25" square pages matching the original game board size:

1. Download the PDF
2. Print double-sided (flip on short edge)
3. Cut to size
4. Use with your Gnomes at Night game pieces

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **UI**: React 19, Tailwind CSS 4, shadcn/ui
- **PDF**: jsPDF for client-side PDF generation
- **Language**: TypeScript 5

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

This project is for personal/educational use. Gnomes at Night is a game by Carlo A. Rossi, published by HABA.

## Acknowledgments

- [Gnomes at Night](https://boardgamegeek.com/boardgame/205766/gnomes-at-night) by Carlo A. Rossi
- [shadcn/ui](https://ui.shadcn.com/) for UI components
- [jsPDF](https://github.com/parallax/jsPDF) for PDF generation
