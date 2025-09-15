# 🗺️ Postal Code Map

> A modern Angular 18+ application for interactive postal code visualization and exploration using real-time geographic data.

[![Angular](https://img.shields.io/badge/Angular-18.2-red.svg)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-green.svg)](https://leafletjs.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1-38B2AC.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🌟 Overview

Postal Code Map is an enterprise-grade Angular application that provides an intuitive interface for exploring postal codes across different countries and cities. Built with modern Angular 18+ features including standalone components, signals API, and clean architecture principles.

### ✨ Key Features

- 🌍 **Interactive World Map** - Powered by Leaflet.js with custom markers and smooth animations
- 🔍 **Smart Search** - Country and city-based filtering with real-time suggestions
- 📍 **Postal Code Visualization** - Visual markers with detailed popup information
- 📊 **Collapsible Results Table** - Accessible data table with sorting and filtering
- 🎯 **Marker Selection** - Click-to-select functionality with visual feedback
- 📱 **Responsive Design** - Mobile-first approach with Tailwind CSS
- ♿ **Accessibility First** - ARIA labels, keyboard navigation, and screen reader support
- ⚡ **Performance Optimized** - Lazy loading, signals-based reactivity, and efficient rendering

## 🏗️ Architecture

### Technology Stack

- **Frontend Framework**: Angular 18.2+ (Standalone Components)
- **State Management**: Angular Signals API
- **Mapping Library**: Leaflet.js 1.9.4
- **Styling**: TailwindCSS 4.1+ with custom utilities
- **HTTP Client**: Angular HttpClient with RxJS
- **Data Source**: OpenDataSoft Geonames API
- **Build Tool**: Angular CLI with esbuild
- **Package Manager**: pnpm

### Project Structure

```
src/app/
├── core/                    # Singleton services, stores, and utilities
│   ├── api/                # HTTP services and API integration
│   ├── models/             # TypeScript interfaces and types
│   ├── stores/             # Signal-based state management
│   └── utils/              # Utility functions and helpers
├── features/               # Feature modules
│   └── location-map/       # Main map feature
│       ├── components/     # Feature-specific components
│       └── location-map.page.ts
├── shared/                 # Reusable components and utilities
├── app.component.ts        # Root component
├── app.config.ts          # Application configuration
└── app.routes.ts          # Routing configuration
```

### Key Components

- **MapCanvasComponent**: Core mapping functionality with Leaflet integration
- **SearchInputComponent**: Smart search with country/city filtering
- **CollapsibleResultsTableComponent**: Accessible data table with postal code results
- **LocationMapPageComponent**: Main page orchestrating all features

## 🚀 Getting Started

### Prerequisites

- **Node.js**: 18.x or higher
- **pnpm**: 8.x or higher (recommended) or npm
- **Angular CLI**: 18.x or higher

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd postal-code-map
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Start development server**

   ```bash
   pnpm start
   # or
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:4200/`

### Available Scripts

| Command                  | Description                                     |
| ------------------------ | ----------------------------------------------- |
| `pnpm start`             | Start development server                        |
| `pnpm build`             | Build for production                            |
| `pnpm test`              | Run unit tests in watch mode                    |
| `pnpm run test:no-watch` | Run all tests once without watch mode           |
| `pnpm run test:coverage` | Run tests with code coverage report             |
| `pnpm run test:specific` | Run specific tests (use with --include pattern) |
| `pnpm lint`              | Run ESLint                                      |
| `pnpm format`            | Format code with Prettier                       |
| `pnpm type-check`        | TypeScript type checking                        |

## 🎯 Usage

### Basic Workflow

1. **Select a Country**: Use the search dropdown to select a country
2. **Choose a City**: After country selection, choose a specific city (optional)
3. **Explore the Map**: View postal codes as interactive markers
4. **View Details**: Click markers to see detailed postal code information
5. **Browse Results**: Use the collapsible table to browse all results

### Features in Detail

#### Interactive Map

- Pan and zoom to explore different regions
- Click markers to view postal code details
- Visual feedback for selected markers
- Smooth animations and transitions

#### Smart Search

- Type-ahead search for countries and cities
- Real-time filtering and suggestions
- Keyboard navigation support

#### Results Table

- Collapsible interface to save screen space
- Sortable columns for better data exploration
- Accessible design with proper ARIA labels

## 🛠️ Development

### Code Quality

This project follows strict code quality standards:

- **ESLint**: Enforces coding standards and best practices
- **Prettier**: Automatic code formatting
- **Husky**: Pre-commit hooks for quality assurance
- **TypeScript Strict Mode**: Enhanced type safety
- **Angular Style Guide**: Official Angular coding conventions

### Testing

The project includes comprehensive unit tests using Jasmine and Karma:

```bash
# Run tests in watch mode (default)
pnpm test

# Run tests once without watch mode
pnpm run test:no-watch

# Run tests with code coverage report
pnpm run test:coverage

# Run specific test files
pnpm run test:specific "**/component.spec.ts"
```

**Test Coverage:**

- Component unit tests with TestBed configuration
- Service testing with dependency injection
- Signal-based state management testing
- Accessibility and user interaction testing

### Building for Production

```bash
# Build for production
pnpm build

# Build with specific configuration
pnpm build --configuration production
```

The build artifacts will be stored in the `dist/` directory.

## 🌐 API Integration

The application integrates with the OpenDataSoft Geonames API to fetch postal code data:

- **Base URL**: `https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/geonames-postal-code`
- **Data Format**: JSON with geographic coordinates and administrative divisions
- **Rate Limiting**: Handled gracefully with loading states and error handling

## 📱 Browser Support

- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

### Development Guidelines

Please refer to [guidelines.md](./guidelines.md) for detailed development standards and best practices.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ using Angular 18+ and modern web technologies**
