import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
  private animeService = inject(AnimeService);
  private filterService = inject(FilterService);

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