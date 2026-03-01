# Angular 21.2.0 Major Update v4.0.0 - 2026-02-28

- **Angular Major Update (20 → 21)**:
  - Updated Angular core packages from 20.3.16 to 21.2.0
  - Updated Angular CLI from 20.3.14 to 21.2.0
  - Updated @angular-devkit/build-angular from 20.3.14 to 21.2.0
  - Updated @angular/compiler-cli from 20.3.16 to 21.2.0
  - Upgraded TypeScript from 5.8 to 5.9.3 (required by Angular 21)
  - Updated zone.js from ~0.15.0 to ~0.16.0
  - All Angular packages now on latest stable version (21.2.0)

- **UI/UX Design Overhaul — Refined Monochrome Editorial**:
  - Redesigned the entire visual identity with a refined monochrome editorial aesthetic
  - Updated color system with zinc-based dark palette and subtle accent colors
  - Improved typography, spacing, and visual hierarchy across all components

- **Alternative Covers Feature**:
  - Added support for alternative cover images per anime entry
  - Gallery cards display alternative covers with indicator badge and navigation
  - Anime info modal shows all available covers with thumbnail strip and selection
  - Alternative covers stored in `alternativeCovers` array field in `animes.json`

# Angular 20.3.16 Patch Update v3.1.1 - 2026-01-16

- **Angular Patch Update**:
  - Updated Angular core packages from 20.3.14 to 20.3.16
  - Updated Angular CLI from 20.3.12 to 20.3.14
  - Updated @angular-devkit/build-angular from 20.3.12 to 20.3.14
  - All Angular packages now on latest patch version (20.3.16) for improved stability and bug fixes

- **Security Fixes**:
  - Added package override for `tar` dependency to address vulnerability GHSA-8qq5-rm4j-mr97
  - Forced tar version to ^7.5.3 to fix path sanitization bypass on Windows
  - Resolved high severity vulnerabilities in development dependencies

# UI/UX Redesign: Floating Containers & Minimal Header v3.1.0 - 2025-12-5

- **Angular 20 Update**:
  - Updated Angular core packages from 20.3.9 to 20.3.14
  - Updated Angular CLI from 20.3.8 to 20.3.12
  - Upgraded TypeScript from 5.7.3 to 5.8 to meet Angular 20.3.14 requirements
  - Fixed js-yaml security vulnerability via `npm audit fix`

- **Icon Style Update**:
  - Changed Google Material Icons from `material-symbols-outlined` to `material-symbols-rounded`
  - Added Fill=1 and weight=300 for a more polished, filled icon appearance
  - Updated font link to use `opsz,wght,FILL,GRAD@20..48,300,1,0`

- **Floating Container Design**:
  - Implemented floating container effect for main content area with margins from edges
  - Added `--body-background` CSS variable for page background color
  - Added `--main-container-bg` and `--main-container-shadow` variables for container styling
  - Main content now has `border-radius: 16px` and box-shadow for elevated appearance
  - Filter sidebar matches main content styling with rounded corners and shadow

- **Search Bar Redesign**:
  - Converted search bar from floating bottom element to fixed top position
  - Positioned between header and main content container
  - Simplified structure by removing nested background wrapper
  - Search container now directly uses main container styling (shadow, border-radius)
  - Cleaner single-level visual design

- **Header Redesign**:
  - Removed background color and backdrop blur for transparent header
  - Removed bottom border for cleaner, integrated look
  - Reduced title font size to 1.5rem with font-weight 600 and letter-spacing -0.02em
  - Subtitle uses lighter font-weight 400
  - Buttons reduced from 40px to 36px with subtler colors
  - Buttons use `--subtitle-color` by default, `--text-color` on hover
  - Mobile: subtitle hidden for more space, elements stay horizontal
  - Increased header button and icon sizes (40px buttons, 24px icons)
  - Improved hover states visibility in light mode using `--surface-hover`

- **Sticky Top Controls**:
  - Sort controls (A-Z, Date) now sticky within main content
  - Added backdrop blur effect when scrolling
  - Added anime counter badge with icon showing total filtered results

- **Header Navigation**:
  - Changed header title link from `href` to `routerLink` to prevent page reload

- **Responsive Improvements**:
  - Adjusted spacing and positioning for mobile breakpoints
  - Filter bar maintains floating container style on desktop
  - Improved mobile layout with appropriate border-radius (12px)
  - Increased mobile header icon sizes for better touch targets

- **Favorites Feature**:
  - Added new `/favorites` route with dedicated `FavoritesPageComponent`
  - Created `FavoritesService` with localStorage persistence for favorite animes
  - Implemented favorites management using Angular signals (`favoriteTitles`, `favoritesCount`)
  - Added favorite toggle button (heart icon) on each anime card in the gallery
  - Favorites button always visible on cards (no hover required)
  - "Clear All Favorites" button with confirmation dialog on favorites page
  - Favorites data persists across browser sessions

- **Navigation Tabs Component**:
  - Created new `NavigationTabsComponent` for page navigation
  - Vertical layout tabs with Catalog and Favorites options
  - Favorites tab displays live badge count of saved animes
  - Uses `RouterLink` and `RouterLinkActive` for route highlighting
  - Positioned in filter bar sidebar

- **Performance Optimization**:
  - Implemented memoized sorting cache for instant sort switching (O(1) lookup)
  - Pre-computes all 4 sort combinations (`asc-newest`, `asc-oldest`, `desc-newest`, `desc-oldest`)
  - Sort switching now instantaneous with zero computation delay
  - Increased `INITIAL_LOAD_COUNT` from 20 to 24 for better initial gallery display
  - Added `filterHasNoAnimes` computed signal to differentiate empty filter vs no search results

- **Modal Redesign**:
  - Redesigned `AnimeInfoModalComponent` with modern grid layout
  - Improved information organization with structured metadata display
  - Redesigned `TrailerModalComponent` with cleaner UI and better visual styling
  - Added copy trailer URL functionality with visual feedback
  - Enhanced modal close interactions

- **Angular Best Practices**:
  - Applied `ChangeDetectionStrategy.OnPush` to all updated components
  - Used native control flow (`@if`, `@for`) instead of structural directives
  - Removed explicit `standalone: true` (default in Angular 19+)
  - Used `inject()` function instead of constructor injection
  - Cached favorites set using `computed()` for efficient lookups in gallery

- **Code Quality**:
  - Used template literals (backticks) for string concatenation throughout codebase
  - Added type-safe sort keys using template literal types (`${SortOrder}-${DateSortOrder}`)
  - Improved error messages for empty states (filter empty vs search no results)

- **Component Removal**:
  - Removed `BackToTopButtonComponent` entirely from the application
  - Cleaned up all references and imports

- **Color System Redesign**:
  - Implemented comprehensive gray scale hierarchy (`--gray-50` to `--gray-950`)
  - Created semantic color variables for consistent theming
  - Added `--background-rgb` for rgba color support
  - Improved light/dark mode color contrast and accessibility
  - Updated all components to use new CSS variable system

- **Theme Switching Optimization**:
  - Removed transition animations from theme switching for instant color changes
  - Changed `transition: all` to specific property transitions (`transform`, `opacity`, `border-color`)
  - Prevents slow color animation when toggling between light and dark modes
  - Updated transitions in: header, side-menu, search-bar, top-controls, anime-gallery, filter-bar, navigation-tabs, anime-info-modal, trailer-modal

- **Side Menu Improvements**:
  - Fixed mobile viewport using `100dvh` and `env(safe-area-inset-bottom)`
  - Replaced header border with CSS mask-image gradient fade effect
  - Separated overlay and menu panel into sibling elements for independent animations
  - Overlay now has smooth opacity fade while menu slides without opacity changes
  - Synchronized overlay fade with panel slide animation timing

- **Gallery Enhancements**:
  - Increased action button sizes (38px) and icon sizes (22px)
  - Changed overlay info from resolution to release year display
  - Added anime type badge (TV, Movie, OVA, etc.) to card overlay
  - Added "Clear filters" button when no results found with active filters

# Angular 20 Upgrade and Security Fixes v3.0.0

- **Angular 20 Framework Upgrade**:
  - Upgraded from Angular 19.2.15 to Angular 20.3.9 (latest stable version)
  - Updated TypeScript from 5.7.2 to 5.9.3 for improved type safety and performance
  - Updated all Angular packages to 20.3.x for consistency and compatibility
  - Upgraded Angular CLI and DevKit to 20.3.8 for latest tooling features

- **Security Improvements**:
  - Resolved critical Vite vulnerability (GHSA-93m4-6634-74q7): "server.fs.deny bypass via backslash on Windows"
  - Updated Vite from vulnerable versions (6.0.0-6.4.0) to secure version (6.4.1+)
  - Executed `npm audit fix` - **0 vulnerabilities** remaining
  - Enabled Git long paths support for Windows to handle long filename paths

- **Configuration Fixes**:
  - Fixed syntax error in `angular.json` (removed trailing comma in scripts array)
  - Cleaned and reinstalled all dependencies (975 packages) for fresh Angular 20 environment
  - Resolved TypeScript declaration file issues for `@angular/common` and `@angular/common/http`

- **Testing Improvements**:
  - Fixed failing unit test in `app.component.spec.ts`
  - Updated test expectations to match actual application structure
  - Changed from checking non-existent `<h1>` element to verifying real components (`app-header`, `app-back-to-top-button`)
  - All tests now passing successfully

- **Git and Repository Management**:
  - Successfully merged `master` branch changes into `main` branch using `--allow-unrelated-histories`
  - Resolved merge conflicts in `package-lock.json` and `app.component.spec.ts`
  - Removed redundant `master` branch (both local and remote)
  - Streamlined repository to single `main` branch workflow

- **Performance and Stability**:
  - Fresh dependency installation ensures optimal package resolution
  - No deprecated package warnings affecting functionality
  - Improved build performance with Angular 20's enhanced compiler
  - Zero compilation errors and clean build output

# Fix: Complete SSR Removal and Client-Only Configuration v2.3.0

- **SSR Completely Disabled**: 
  - Removed Server-Side Rendering (SSR) functionality entirely to eliminate NG0401 platform injector errors and security vulnerabilities.
  - Converted the application to a pure Client-Side Rendering (CSR) Single Page Application for simplified deployment and maintenance.
  - Resolved Angular SSR Global Platform Injector Race Condition security issue that could lead to cross-request data leakage.

- **Configuration Cleanup**:
  - **Removed SSR Files**: Deleted `src/main.server.ts`, `src/server.ts`, and `src/app/app.config.server.ts` files.
  - **Updated angular.json**: Removed `server`, `prerender`, and `ssr` configurations from build options.
  - **Cleaned TypeScript Config**: Updated `tsconfig.app.json` to remove references to deleted SSR files.
  - **Removed Client Hydration**: Eliminated `provideClientHydration()` from app configuration to prevent NG0505 warnings.

- **Dependencies Optimization**:
  - **Removed SSR Packages**: Uninstalled `@angular/platform-server`, `@angular/ssr`, `express`, and `@types/express`.
  - **Cleaned Scripts**: Removed `serve:ssr:anime-cover-catalog-angular` script from package.json.
  - **Maintained Core Functionality**: Preserved all client-side features including routing, HTTP client, and analytics.

- **Performance Benefits**:
  - **Faster Development**: Eliminated SSR compilation overhead during development builds.
  - **Simpler Deployment**: No server-side requirements, can be deployed as static files to any CDN or static hosting service.
  - **Reduced Bundle Size**: Removed server-specific dependencies and code, resulting in a lighter application.
  - **No Security Vulnerabilities**: Eliminated SSR-related security risks and platform injector race conditions.

# Performance: Optimized Image Loading with Thumbnails v2.2.0
- **Optimized Page Load Speed**: 
  - Implemented a thumbnail-based image loading strategy to dramatically reduce the initial page load time for the anime gallery.
  - The gallery now loads lightweight, low-resolution preview images (`/assets/AnimeImages_thumbs/`) by default, ensuring a fast and smooth user experience.
  - Original high-resolution images are now only loaded when the user explicitly clicks the "Download" button, optimizing bandwidth usage.

# Feature: Vercel Web Analytics Integration v2.1.0
- **First-party Analytics**  
  - Added Vercel Web Analytics to track privacy-friendly page views with zero cookies.  
  - Installed `@vercel/analytics` as a dependency and injected the script via `inject()` in `src/main.ts`.  
  - Requires enabling the Analytics tab in the Vercel dashboard; starts collecting data automatically after the next deployment.
- **No Runtime Overhead**  
  - The tracking script weighs ~1 kB and is loaded only on the client, keeping SSR builds unaffected.

# Fix: Robust Routing and SSR v2.0.1

- **Robust Root Routing**:
    -   Modified `app.routes.ts` to use the root path (`/`) for the main catalog view, removing the `/catalog` prefix from the default URL for a cleaner user experience.
    -   Ensured that filtered views (e.g., `/catalog/genre/action`) continue to use the `/catalog` prefix, maintaining clear and bookmarkable URLs.
    -   Updated the `filter-bar` component to generate correct router links for both the root catalog and specific filtered views.
- **SSR Data Fetching Fix**:
    -   Resolved a critical issue where accessing filtered URLs directly failed to load anime data during Server-Side Rendering.
    -   Configured `HttpClient` specifically for the server environment (`app.config.server.ts`), enabling the Node.js server to correctly fetch local data assets (e.g., `animes.json`) and properly pre-render the page with the correct filters applied.

# Angular Framework Migration & Full Refactor v2.0.0

- **Complete Framework Overhaul**: Migrated the entire project from static HTML, CSS, and JavaScript to the **Angular framework**, establishing a modern, scalable, and maintainable Single-Page Application (SPA) architecture.
- **Component-Based Structure**: Decomposed the UI into modular, reusable components (e.g., `HeaderComponent`, `FilterBarComponent`, `AnimeGalleryComponent`, `SearchBarComponent`), promoting code organization and reusability.
- **Reactive State Management with Signals**: Implemented state management using Angular Signals within dedicated services (`AnimeService`, `FilterService`), ensuring the UI reacts instantly and efficiently to data changes.
- **Client-Side Routing**: Introduced client-side navigation with Angular Router. URLs are now dynamic and bookmarkable (e.g., `/catalog/genre/action`), enhancing user experience and enabling deep linking.
- **Centralized Logic with Services**: Abstracted data fetching, filtering, sorting, and modal logic into dedicated services, decoupling business logic from UI components.
- **Dynamic and Context-Aware UI**:
    -   The search bar placeholder now dynamically updates to reflect the number of animes within the current filter.
    -   Filter badges show real-time counts of available items.
- **Enhanced UI/UX**:
    -   Refined the filter bar to be a fixed sidebar on desktop and a responsive, fixed top bar on mobile with a backdrop-blur effect.
    -   Implemented a globally consistent, custom-styled scrollbar for all scrollable elements.
    -   Improved user interaction by making card clicks open modals only on desktop devices, preventing accidental taps on mobile.
- **Code Quality and Best Practices**:
    -   Replaced navigation buttons with semantic `<a>` tags using Angular's `RouterLink` for better accessibility and user experience.
    -   Refactored and scoped CSS for better modularity and removed obsolete code.
    -   Corrected all metadata and asset paths for project-wide consistency.

# UI/UX and Accessibility Improvements v1.6.2

- Improved filter button functionality: Clicking on filter badges now triggers the filter selection
- Removed backdrop-filter (blur effect) from all UI elements except the main header for better performance
- Improved modal positioning for better accessibility and visibility on mobile devices
- Optimized button clicks to prevent unnecessary gallery reloads when clicking the same filter
- Adjusted card info overlay position on mobile to make text more visible and readable
- Modified mobile filters bar to use solid background color instead of transparent with blur
- Enhanced mobile layout when displaying anime info and resolution
- Added proper vertical spacing for action buttons in mobile view to prevent overlaps
- Improved initial gallery load by automatically sorting anime by name (A-Z) and date (newest first)
- Fixed filter selection responsiveness for better mobile experience
- Added fade effect to the sides of the mobile filters bar for better visual indication of scrollable content
- Improved horizontal scrolling experience on mobile with gradient mask on filter bar edges

# Fix: Load All button overlap v1.6.1

- Fixed an issue where the "Load All Animes" button could overlap with the floating search bar, especially on smaller screens.
- Added `margin-bottom` to `.load-all-container` in both desktop and mobile views to ensure sufficient spacing.

# UI/UX Overhaul and Feature Refinements v1.6.0

- Refactored filter controls: Replaced sidebar dropdowns with dedicated filter buttons for single-category selection (e.g., Genre, Theme, Type).
- Improved layout: Moved sort controls (Name A-Z/Z-A, Date Newest/Oldest) and View Mode toggle (Cozy/Compact for desktop) to a dedicated bar above the gallery.
- Enhanced gallery cards:
    - Implemented an information overlay on hover, displaying title, resolution, and **image file size**.
    - Added image loading indicators showing percentage and file size.
    - Refined action buttons (Info, Link, Download, Trailer).
- Added Mobile Filter Bar: Introduced a sticky filter bar below the header on mobile devices for easier access to filters.
- Introduced Modals: Implemented modals for displaying detailed anime information and watching trailers.
- Added Filter Badges: Display counts of matching anime directly on the filter buttons.
- **Relocated Author Link**: Moved the author credit link from the footer to a dedicated header button (public icon) next to the theme toggle.
- Optimized Styles: Removed deprecated `.compact` view mode styles for mobile/tablet, focusing on `.cozy` as default for smaller screens. General CSS cleanup and improvements.

# Website Improvements v1.5.0

- Added new Genres filter with multiple options (Action, Adventure, etc.)
- Added Explicit Genres filter (Ecchi, Erotica, Hentai)
- Added Type filter with expanded options (TV, OVA, Movie, etc.)
- Added Episodes field for each anime in the catalog
- Added Genres field for each anime in the catalog
- Added website self-redirect link in header title
- Added custom text selection colors
- Improved filter system to handle multiple active filters simultaneously
- Enhanced anime information display to show episode count and genres
- Updated copy functionality to include episode and genre information
- Updated anime cards to display new fields in information panel
- Fixed genre filtering to work with multiple genre values
- Fixed type filtering to support all anime types
- Optimized filter performance for multiple active filters


# Website Improvements v1.4.3

- Inverted floating search bar theme colors
  - Light mode now shows dark search bar
  - Dark mode now shows light search bar
  - Maintains all existing animations and behaviors


# Website Improvements v1.4.2

- Added "translate=no" attribute to Google Material Icons to prevent automatic translation
- Changed font family to Poppins for search input and placeholder text
- Modified clear search button hover effect to be circular instead of animated
- Centered and reorganized "No results found" message in the anime gallery
- Increased text size and adjusted spacing in "No results found" message
- Repositioned search icon above text in "No results found" message
- Improved visual hierarchy of "No results found" message components
- Optimized mobile compact view with better spacing and readability
- Adjusted card sizes and image heights for mobile compact mode
- Reduced button sizes and spacing for better mobile compact layout
- Improved text readability in compact mode with adjusted font sizes
- Enhanced mobile compact view grid layout with consistent spacing
- Added responsive adjustments for very small screens in compact mode
- Maintained content visibility while maximizing space efficiency in mobile compact view
- Added "translate=no" attribute to anime titles to prevent automatic translation

# Website Improvements v1.4.1

- Increased main content top margin on mobile to prevent header overlap
- Adjusted sidebar to take full screen on mobile while keeping content centered
- Increased border radius of sidebar elements for smoother appearance
- Changed inputs background to transparent in both light and dark modes
- Unified and optimized filter styles:
  - Combined all filter selector styles
  - Standardized filter labels and icons
  - Removed redundant individual filter code
  - Matched appearance across all sorting and filtering options
- Improved mobile layout and spacing adjustments
- Enhanced visual consistency between light and dark modes
- Increased border radius of anime cards and trailer modal
- Reduced size of action buttons and their icons
- Improved hover states across the interface:
  - Added circular hover effect to all buttons
  - Standardized hover transitions
  - Enhanced theme-specific hover backgrounds
- Optimized YouTube trailer player:
  - Set white progress bar for visual consistency
  - Added default 50% volume setting

# Website Improvements v1.4.0

### New Features
- Added new demographic filter with options:
  - Josei
  - Kids
  - Seinen
  - Shoujo
  - Shounen
- Added new theme filter with extensive options including:
  - Adult Cast
  - Anthropomorphic
  - CGDCT
  - Childcare
  - Combat Sports
  - And many more (50+ themes)
- Added demographic information to anime cards and info modal
- Added theme information to anime cards and info modal
- Added new trailer button with YouTube icon in red color for each anime card
- Added modal window for watching trailers with 16:9 aspect ratio
- Added trailer modal header with title and close button
- Added loading progress bar for image covers with smooth animation
- Added proper event handling for modal interactions
- Added "Not Available" message display for animes without trailers
- Added copy trailer URL button in trailer modal
- Added visual feedback when copying trailer URL
- Added proper handling for unavailable trailers in the data structure

### Modifications
- Updated copy functionality to include demographic and theme information
- Updated filter system to handle multiple filter types simultaneously
- Enhanced theme filtering to properly handle animes with multiple themes
- Modified card information display to show new fields
- Enhanced filter reset functionality to include new filters
- Modified button styles to maintain consistency across all action buttons
- Modified modal interaction to prevent page scrolling when open
- Modified image loading system to show real-time progress
- Updated CSS selectors to unify button styles including the new trailer button
- Updated modal z-index to ensure proper display above all elements
- Updated trailer modal header to include copy URL functionality
- Modified trailer button visibility logic to handle "Not Available" cases
- Enhanced trailer modal UI with new button layout
- Updated modal header styling to accommodate new copy URL button
- Modified trailer URL handling to support both YouTube embed and direct links
- Modified mobile sidebar filters to prevent text overflow and improve scrolling experience

### Fixes & Improvements
- Fixed button size consistency in responsive design
- Fixed scroll behavior when modal is open
- Fixed image loading progress visualization
- Improved visual feedback during image loading
- Improved modal close interactions (button and outside click)
- Enhanced loading feedback for image covers
- Enhanced keyboard navigation and accessibility for modal content
- Improved trailer availability detection
- Enhanced modal header button organization
- Added proper spacing between modal header buttons
- Improved visual feedback for URL copying action
- Enhanced error handling for trailer URLs

# Website Improvements v1.3.3

- Added new trailer button with YouTube icon in red color for each anime card
- Added modal window for watching trailers with 16:9 aspect ratio
- Added trailer modal header with title and close button
- Added loading progress bar for image covers with smooth animation
- Added proper event handling for modal interactions
- Modified button styles to maintain consistency across all action buttons
- Modified modal interaction to prevent page scrolling when open
- Modified image loading system to show real-time progress
- Updated CSS selectors to unify button styles including the new trailer button
- Updated modal z-index to ensure proper display above all elements
- Fixed button size consistency in responsive design
- Fixed scroll behavior when modal is open
- Fixed image loading progress visualization
- Improved visual feedback during image loading
- Improved modal close interactions (button and outside click)
- Enhanced loading feedback for image covers
- Enhanced keyboard navigation and accessibility for modal content

# Website Improvements v1.3.2

- Added new filter option to sort animes by type (TV, Movie, Special, OVA)
- Added type information in anime details modal
- Added type information when copying anime details
- Updated styles for type filter select element to match existing design
- Enhanced "Load All" button to respect type filter selection
- Added Material Icons for filter sections (sort_by_alpha, calendar_month, movie)
- Improved filter robustness when combining multiple filter options

# Website Improvements v1.3.1

- Renamed `icon` folder to `icons`
- Added new social preview image `catalog_logo.png`
- Updated image paths in HTML

# Website Improvements v1.3.0

- Enhanced SEO with expanded meta tags (Twitter cards, OpenGraph, mobile web app)
- Implemented new floating search bar design with improved UI
- Restructured header layout and theme toggle position
- Added full website URL support in meta tags for better sharing
- Improved meta descriptions and content organization
- Redesigned side controls panel with fixed position and improved scrolling
- Enhanced gallery layout with better grid system for cozy and compact views
- Added new animations and transitions for better UX
- Improved responsive design for all screen sizes
- Added blur effect when sidebar is active
- Optimized search bar interactions and animations
- Updated theme toggle button styling and positioning
- Added new sidebar functionality with mobile-first approach
- Improved copy functionality with visual feedback animations
- Enhanced search functionality with dynamic placeholder text
- Improved back-to-top button with dynamic positioning
- Improved lazy loading implementation
- Added sidebar state management and responsive behavior

# Website Improvements v1.2.5

- Fixed image URL copying to include full domain path

# Website Improvements v1.2.4

- Added "Copy Image URL" button with link icon and visual feedback
- Changed labels to `<h4>` elements (`View Mode : ` and `Theme : `)
- Added sticky behavior to filters section
- Improved filters section visibility when zooming
- Adjusted filters section height calculation using `95vh`
- Added proper spacing and rounded borders visibility for filters
- Fixed filters section overlap with fixed header in cozy mode
- Added custom scrollbar styles for filters section
- Optimized filters section display for 1366x768 resolution
- Added blur effect to background when sidebar is active
- Added website favicon and Apple touch icon
- Improved search bar hover effect in dark mode with white border
- Enhanced back-to-top button with theme-dependent background
- Optimized mobile header layout with improved title and search bar positioning

# Website Improvements v1.2.3

- Expanded anime library, adding more titles to the list for a richer user experience.

# Website Improvements v1.2.2  

- Implemented lazy loading for images using the Intersection Observer API to improve initial page load performance.  
- Added placeholder images while content loads to prevent layout shifts and enhance visual stability.  
- Optimized bandwidth usage by loading images only when they become visible in the viewport, reducing unnecessary data consumption.  
- Enhanced user experience with smooth opacity transitions when images load.  
- Improved resolution handling, ensuring display updates only after the image is fully loaded.  
- Preloaded images with a 50px margin to ensure seamless transitions as users scroll.  
- Reduced initial network requests for hidden images, significantly boosting page performance.  
- Enhanced anime title functionality, making them clickable with copy-to-clipboard features, accompanied by visual feedback (copy/check icons with smooth transitions).  
- Fixed sorting system to ensure consistent order in both initial and expanded anime list views when filtering by name or date.  
- Updated anime images, replacing some with higher-resolution versions to improve visual quality and overall user experience. 

# Website improvements v1.2.1

- Adjusted cozy view mode to display 3 cards per row in desktop view for better content visibility
- Reduced spacing between anime cards in cozy view mode for a more compact layout
- Optimized grid layout spacing from 2rem to 1rem for improved visual consistency
- Maintained responsive design with 2 cards per row on tablets and 1 card on mobile devices
- Improved grid system implementation for better performance and maintainability

# Website improvements v1.2.0
- Added new "Copy Information" button between info and download buttons
- Added visual feedback when copying anime information (icon changes to check mark)
- Added compact view mode option for gallery display (4 cards per row)
- Added cozy view mode option for gallery display (2 cards per row)
- Added sidebar menu for mobile devices with theme toggle and filters
- Added compact header style when compact view mode is active
- Added Poppins font to all buttons and labels for consistency
- Fixed button sizes in mobile view to maintain uniformity
- Fixed sidebar content overflow issues in mobile view
- Improved responsive design for different screen sizes
- Consolidated and optimized media queries for improved code maintainability and performance

# Website improvements v1.1.0

- Added arrow_downward icon to "Load All Animes" button
- Fixed icon and text alignment in "Load All Animes" button
- Added Poppins font to "Load All Animes" button text
- Added Poppins font to Filter options and labels
- Added fixed header with blur effect when scrolling
- Added scroll to top when searching for results
- Added clear search button in search input
- Added "No results found" message with search term when no matches are found
- Hidden "Load All Animes" button when no search results are found
- Improved counter logic in "Load All Animes" button to show remaining animes
- Added the word "more" next to the counter for better clarity
- Implemented total load persistence: once all animes are loaded, subsequent searches will show complete results
- Updated footer link to direct to https://donyaep.vercel.app/
- Fixed filters visibility on mobile devices:
  - Increased margin-top to 4rem in filters-group for better spacing
  - Adjusted main-content margin-top to prevent filters from being hidden behind fixed header
  - Improved responsive layout for better filter accessibility on smaller screens


# Website improvements v1.0.1

- Added arrow_downward icon to "Load All Animes" button
- Fixed icon and text alignment in "Load All Animes" button
- Added Poppins font to "Load All Animes" button text
- Added Poppins font to Filter options and labels
- Added fixed header with blur effect when scrolling
- Added scroll to top when searching for results
- Added clear search button in search input
- Added "No results found" message with search term when no matches are found
- Hide "Load All Animes" button when no search results are found
- Improve counter logic in "Load All Animes" button to show remaining animes
- Add the word "more" next to the counter for better clarity
- Implement total load persistence: once all animes are loaded, subsequent searches will show complete results
- Update footer link to direct to https://donyaep.vercel.app/