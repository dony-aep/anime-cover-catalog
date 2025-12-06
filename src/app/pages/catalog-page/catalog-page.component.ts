import { Component, ChangeDetectionStrategy, inject, OnInit, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AnimeService } from '../../services/anime.service';
import { FilterBarComponent } from '../../components/filter-bar/filter-bar.component';
import { SearchBarComponent } from '../../components/search-bar/search-bar.component';
import { TopControlsComponent } from '../../components/top-controls/top-controls.component';
import { AnimeGalleryComponent } from '../../components/anime-gallery/anime-gallery.component';
import { FilterType } from '../../models/anime.model';
import { FilterService } from '../../services/filter.service';

@Component({
  selector: 'app-catalog-page',
  imports: [
    FilterBarComponent,
    SearchBarComponent,
    TopControlsComponent,
    AnimeGalleryComponent,
  ],
  templateUrl: './catalog-page.component.html',
  styleUrls: ['./catalog-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatalogPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  animeService = inject(AnimeService);
  private filterService = inject(FilterService);

  // Show top-controls only when there are results to display
  showTopControls = computed(() => !this.animeService.noResults());

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const type = params.get('type');
      const routeParam = params.get('value');

      if (type && routeParam) {
        const value = this.filterService.getValueFromRouteParam(routeParam);
        if (value) {
          this.animeService.changeFilter({ type: type as FilterType, value });
        } else {
          this.animeService.changeFilter({ type: 'all', value: '' });
        }
      } else {
        this.animeService.changeFilter({ type: 'all', value: '' });
      }
    });
  }
} 