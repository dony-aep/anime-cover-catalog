import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AnimeService } from '../../services/anime.service';
import { FilterBarComponent } from '../../components/filter-bar/filter-bar.component';
import { SearchBarComponent } from '../../components/search-bar/search-bar.component';
import { TopControlsComponent } from '../../components/top-controls/top-controls.component';
import { AnimeGalleryComponent } from '../../components/anime-gallery/anime-gallery.component';
import { CommonModule } from '@angular/common';
import { FilterType } from '../../models/anime.model';
import { FilterService } from '../../services/filter.service';

@Component({
  selector: 'app-catalog-page',
  standalone: true,
  imports: [
    CommonModule,
    FilterBarComponent,
    SearchBarComponent,
    TopControlsComponent,
    AnimeGalleryComponent,
  ],
  templateUrl: './catalog-page.component.html',
  styleUrls: ['./catalog-page.component.css']
})
export class CatalogPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private animeService = inject(AnimeService);
  private filterService = inject(FilterService);

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const type = params.get('type');
      const routeParam = params.get('value');

      if (type && routeParam) {
        // Validate filter type
        const validFilterTypes: FilterType[] = ['all', 'genre', 'theme', 'demographic', 'type', 'explicitGenre'];
        if (!validFilterTypes.includes(type as FilterType)) {
          this.router.navigate(['/catalog']);
          return;
        }

        const value = this.filterService.getValueFromRouteParam(routeParam);
        if (value) {
          this.animeService.changeFilter({ type: type as FilterType, value });
        } else {
          // If value not found but type is valid, try to find a close match
          const closestValue = this.tryToFindClosestMatch(routeParam);
          if (closestValue) {
            const correctRouteParam = this.filterService.getRouteParamFromValue(closestValue);
            if (correctRouteParam) {
              // Redirect to the correct route param
              this.router.navigate(['/catalog', type, correctRouteParam]);
              return;
            }
          }
          this.router.navigate(['/catalog']);
        }
      } else {
        this.animeService.changeFilter({ type: 'all', value: '' });
      }
    });
  }

  // Try to find a close match for mistyped route params
  private tryToFindClosestMatch(routeParam: string): string | undefined {
    const filters = this.filterService.getFilters();
    const normalizedParam = routeParam.toLowerCase().replace(/-/g, ' ');
    
    // Look for partial matches
    for (const filter of filters) {
      if (filter.value.toLowerCase().includes(normalizedParam) || 
          normalizedParam.includes(filter.value.toLowerCase())) {
        return filter.value;
      }
    }
    return undefined;
  }
}