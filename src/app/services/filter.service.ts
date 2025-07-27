import { Injectable } from '@angular/core';
import { FilterType } from '../models/anime.model';

export interface FilterOption {
  label: string;
  type: FilterType;
  value: string;
}

@Injectable({
  providedIn: 'root'
})
export class FilterService {
  private filters: FilterOption[] = [
    { label: 'All', type: 'all', value: '' },
    { label: 'Action', type: 'genre', value: 'Action' },
    { label: 'Adult Cast', type: 'theme', value: 'Adult Cast' },
    { label: 'Adventure', type: 'genre', value: 'Adventure' },
    { label: 'Anthropomorphic', type: 'theme', value: 'Anthropomorphic' },
    { label: 'Avant Garde', type: 'genre', value: 'Avant Garde' },
    { label: 'Award Winning', type: 'genre', value: 'Award Winning' },
    { label: 'Boys Love', type: 'genre', value: 'Boys Love' },
    { label: 'CGDCT', type: 'theme', value: 'CGDCT' },
    { label: 'Childcare', type: 'theme', value: 'Childcare' },
    { label: 'CM', type: 'type', value: 'CM' },
    { label: 'Combat Sports', type: 'theme', value: 'Combat Sports' },
    { label: 'Comedy', type: 'genre', value: 'Comedy' },
    { label: 'Crossdressing', type: 'theme', value: 'Crossdressing' },
    { label: 'Delinquents', type: 'theme', value: 'Delinquents' },
    { label: 'Detective', type: 'theme', value: 'Detective' },
    { label: 'Drama', type: 'genre', value: 'Drama' },
    { label: 'Ecchi', type: 'explicitGenre', value: 'Ecchi' },
    { label: 'Educational', type: 'theme', value: 'Educational' },
    { label: 'Erotica', type: 'explicitGenre', value: 'Erotica' },
    { label: 'Fantasy', type: 'genre', value: 'Fantasy' },
    { label: 'Gag Humor', type: 'theme', value: 'Gag Humor' },
    { label: 'Girls Love', type: 'genre', value: 'Girls Love' },
    { label: 'Gore', type: 'theme', value: 'Gore' },
    { label: 'Gourmet', type: 'genre', value: 'Gourmet' },
    { label: 'Harem', type: 'theme', value: 'Harem' },
    { label: 'Hentai', type: 'explicitGenre', value: 'Hentai' },
    { label: 'High Stakes Game', type: 'theme', value: 'High Stakes Game' },
    { label: 'Historical', type: 'theme', value: 'Historical' },
    { label: 'Horror', type: 'genre', value: 'Horror' },
    { label: 'Idols (Female)', type: 'theme', value: 'Idols (Female)' },
    { label: 'Idols (Male)', type: 'theme', value: 'Idols (Male)' },
    { label: 'Isekai', type: 'theme', value: 'Isekai' },
    { label: 'Iyashikei', type: 'theme', value: 'Iyashikei' },
    { label: 'Josei', type: 'demographic', value: 'Josei' },
    { label: 'Kids', type: 'demographic', value: 'Kids' },
    { label: 'Love Polygon', type: 'theme', value: 'Love Polygon' },
    { label: 'Love Status Quo', type: 'theme', value: 'Love Status Quo' },
    { label: 'Magical Sex Shift', type: 'theme', value: 'Magical Sex Shift' },
    { label: 'Mahou Shoujo', type: 'theme', value: 'Mahou Shoujo' },
    { label: 'Martial Arts', type: 'theme', value: 'Martial Arts' },
    { label: 'Mecha', type: 'theme', value: 'Mecha' },
    { label: 'Medical', type: 'theme', value: 'Medical' },
    { label: 'Military', type: 'theme', value: 'Military' },
    { label: 'Movie', type: 'type', value: 'Movie' },
    { label: 'Music', type: 'type', value: 'Music' },
    { label: 'Music', type: 'theme', value: 'Music' },
    { label: 'Mystery', type: 'genre', value: 'Mystery' },
    { label: 'Mythology', type: 'theme', value: 'Mythology' },
    { label: 'ONA', type: 'type', value: 'ONA' },
    { label: 'Organized Crime', type: 'theme', value: 'Organized Crime' },
    { label: 'Otaku Culture', type: 'theme', value: 'Otaku Culture' },
    { label: 'OVA', type: 'type', value: 'OVA' },
    { label: 'Parody', type: 'theme', value: 'Parody' },
    { label: 'Performing Arts', type: 'theme', value: 'Performing Arts' },
    { label: 'Pets', type: 'theme', value: 'Pets' },
    { label: 'Psychological', type: 'theme', value: 'Psychological' },
    { label: 'PV', type: 'type', value: 'PV' },
    { label: 'Racing', type: 'theme', value: 'Racing' },
    { label: 'Reincarnation', type: 'theme', value: 'Reincarnation' },
    { label: 'Reverse Harem', type: 'theme', value: 'Reverse Harem' },
    { label: 'Romance', type: 'genre', value: 'Romance' },
    { label: 'Samurai', type: 'theme', value: 'Samurai' },
    { label: 'School', type: 'theme', value: 'School' },
    { label: 'Sci-Fi', type: 'genre', value: 'Sci-Fi' },
    { label: 'Seinen', type: 'demographic', value: 'Seinen' },
    { label: 'Shoujo', type: 'demographic', value: 'Shoujo' },
    { label: 'Shounen', type: 'demographic', value: 'Shounen' },
    { label: 'Showbiz', type: 'theme', value: 'Showbiz' },
    { label: 'Slice of Life', type: 'genre', value: 'Slice of Life' },
    { label: 'Space', type: 'theme', value: 'Space' },
    { label: 'Special', type: 'type', value: 'Special' },
    { label: 'Sports', type: 'genre', value: 'Sports' },
    { label: 'Strategy Game', type: 'theme', value: 'Strategy Game' },
    { label: 'Super Power', type: 'theme', value: 'Super Power' },
    { label: 'Supernatural', type: 'genre', value: 'Supernatural' },
    { label: 'Survival', type: 'theme', value: 'Survival' },
    { label: 'Suspense', type: 'genre', value: 'Suspense' },
    { label: 'TV', type: 'type', value: 'TV' },
    { label: 'TV Special', type: 'type', value: 'TV Special' },
    { label: 'Team Sports', type: 'theme', value: 'Team Sports' },
    { label: 'Time Travel', type: 'theme', value: 'Time Travel' },
    { label: 'Urban Fantasy', type: 'theme', value: 'Urban Fantasy' },
    { label: 'Vampire', type: 'theme', value: 'Vampire' },
    { label: 'Video Game', type: 'theme', value: 'Video Game' },
    { label: 'Villainess', type: 'theme', value: 'Villainess' },
    { label: 'Visual Arts', type: 'theme', value: 'Visual Arts' },
    { label: 'Workplace', type: 'theme', value: 'Workplace' },
  ];

  private valueToRouteParamMap = new Map<string, string>();
  private routeParamToValueMap = new Map<string, string>();

  constructor() {
    this.initializeMaps();
  }

  private createRouteParam(value: string): string {
    return value.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '');
  }

  private initializeMaps(): void {
    this.filters.forEach(filter => {
      if (filter.value) {
        const routeParam = this.createRouteParam(filter.value);
        this.valueToRouteParamMap.set(filter.value, routeParam);
        this.routeParamToValueMap.set(routeParam, filter.value);
      }
    });
  }

  getFilters(): FilterOption[] {
    return this.filters;
  }

  getRouteParamFromValue(value: string): string | undefined {
    return this.valueToRouteParamMap.get(value);
  }

  getValueFromRouteParam(routeParam: string): string | undefined {
    return this.routeParamToValueMap.get(routeParam);
  }
} 