import baby from '@waysidemapping/pinhead/dist/icons/baby.svg?raw';
import benchWithBackrest from '@waysidemapping/pinhead/dist/icons/bench_with_backrest.svg?raw';
import book from '@waysidemapping/pinhead/dist/icons/book.svg?raw';
import chapel from '@waysidemapping/pinhead/dist/icons/chapel.svg?raw';
import classicalBuilding from '@waysidemapping/pinhead/dist/icons/classical_building.svg?raw';
import comedyMask from '@waysidemapping/pinhead/dist/icons/comedy_mask.svg?raw';
import coniferTree from '@waysidemapping/pinhead/dist/icons/conifer_tree.svg?raw';
import droplet from '@waysidemapping/pinhead/dist/icons/droplet.svg?raw';
import dumbbell from '@waysidemapping/pinhead/dist/icons/dumbbell.svg?raw';
import leaf from '@waysidemapping/pinhead/dist/icons/leaf.svg?raw';
import lowriseBuilding from '@waysidemapping/pinhead/dist/icons/lowrise_building.svg?raw';
import mapOutline from '@waysidemapping/pinhead/dist/icons/map_outline.svg?raw';
import mapPin from '@waysidemapping/pinhead/dist/icons/map_pin.svg?raw';
import personSwimmingInWater from '@waysidemapping/pinhead/dist/icons/person_swimming_in_water.svg?raw';
import playStructureWithSlide from '@waysidemapping/pinhead/dist/icons/play_structure_with_slide.svg?raw';
import shoppingBag from '@waysidemapping/pinhead/dist/icons/shopping_bag.svg?raw';
import shoppingCart from '@waysidemapping/pinhead/dist/icons/shopping_cart.svg?raw';
import squareAcademicCap from '@waysidemapping/pinhead/dist/icons/square_academic_cap.svg?raw';
import tableWithUmbrella from '@waysidemapping/pinhead/dist/icons/table_with_umbrella.svg?raw';
import triangleUpWithExclamationPoint from '@waysidemapping/pinhead/dist/icons/triangle_up_with_exclamation_point.svg?raw';
import x from '@waysidemapping/pinhead/dist/icons/x.svg?raw';
import { DEFAULT_ICON } from '../constants';

export const ICON_SVGS: Record<string, string> = {
  baby,
  bench_with_backrest: benchWithBackrest,
  book,
  chapel,
  classical_building: classicalBuilding,
  comedy_mask: comedyMask,
  conifer_tree: coniferTree,
  droplet,
  dumbbell,
  leaf,
  lowrise_building: lowriseBuilding,
  map_outline: mapOutline,
  map_pin: mapPin,
  person_swimming_in_water: personSwimmingInWater,
  play_structure_with_slide: playStructureWithSlide,
  shopping_bag: shoppingBag,
  shopping_cart: shoppingCart,
  square_academic_cap: squareAcademicCap,
  table_with_umbrella: tableWithUmbrella,
  triangle_up_with_exclamation_point: triangleUpWithExclamationPoint,
  x,
};

export function getColoredSvg(name: string, color = 'currentColor'): string {
  const raw = ICON_SVGS[name] ?? ICON_SVGS[DEFAULT_ICON];
  if (!raw) return '';
  return raw.replace('<svg ', `<svg fill="${color}" `);
}
