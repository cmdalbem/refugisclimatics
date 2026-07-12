import baby from '@waysidemapping/pinhead/dist/icons/baby.svg?raw';
import barbell from '@waysidemapping/pinhead/dist/icons/barbell.svg?raw';
import chapel from '@waysidemapping/pinhead/dist/icons/chapel.svg?raw';
import classicalBuilding from '@waysidemapping/pinhead/dist/icons/classical_building.svg?raw';
import comedyMaskAndTragedyMask from '@waysidemapping/pinhead/dist/icons/comedy_mask_and_tragedy_mask.svg?raw';
import commercialBuilding from '@waysidemapping/pinhead/dist/icons/commercial_building.svg?raw';
import dogSitting from '@waysidemapping/pinhead/dist/icons/dog_sitting.svg?raw';
import droplet from '@waysidemapping/pinhead/dist/icons/droplet.svg?raw';
import fountainFromWater from '@waysidemapping/pinhead/dist/icons/fountain_from_water.svg?raw';
import internationalWheelchairSymbol from '@waysidemapping/pinhead/dist/icons/international_wheelchair_symbol.svg?raw';
import houseWithChimney from '@waysidemapping/pinhead/dist/icons/house_with_chimney.svg?raw';
import mapleLeaf from '@waysidemapping/pinhead/dist/icons/maple_leaf.svg?raw';
import mapPin from '@waysidemapping/pinhead/dist/icons/map_pin.svg?raw';
import navigationArrowTopRight from '@waysidemapping/pinhead/dist/icons/navigation_arrow_top_right.svg?raw';
import openBook from '@waysidemapping/pinhead/dist/icons/open_book.svg?raw';
import personSwimmingInWater from '@waysidemapping/pinhead/dist/icons/person_swimming_in_water.svg?raw';
import playStructureWithSlide from '@waysidemapping/pinhead/dist/icons/play_structure_with_slide.svg?raw';
import shoppingBasket from '@waysidemapping/pinhead/dist/icons/shopping_basket.svg?raw';
import shoppingCart from '@waysidemapping/pinhead/dist/icons/shopping_cart.svg?raw';
import squareAcademicCap from '@waysidemapping/pinhead/dist/icons/square_academic_cap.svg?raw';
import treeAndBenchWithBackrest from '@waysidemapping/pinhead/dist/icons/tree_and_bench_with_backrest.svg?raw';
import treeRow from '@waysidemapping/pinhead/dist/icons/tree_row.svg?raw';
import triangleUpWithExclamationPoint from '@waysidemapping/pinhead/dist/icons/triangle_up_with_exclamation_point.svg?raw';
import womensAndMensRestroomSymbol from '@waysidemapping/pinhead/dist/icons/womens_and_mens_restroom_symbol.svg?raw';
import wifi from '@waysidemapping/pinhead/dist/icons/wifi.svg?raw';
import x from '@waysidemapping/pinhead/dist/icons/x.svg?raw';
import { DEFAULT_ICON } from '../constants';

export const ICON_SVGS: Record<string, string> = {
  baby,
  barbell,
  chapel,
  classical_building: classicalBuilding,
  comedy_mask_and_tragedy_mask: comedyMaskAndTragedyMask,
  commercial_building: commercialBuilding,
  dog_sitting: dogSitting,
  droplet,
  fountain_from_water: fountainFromWater,
  international_wheelchair_symbol: internationalWheelchairSymbol,
  house_with_chimney: houseWithChimney,
  maple_leaf: mapleLeaf,
  map_pin: mapPin,
  navigation_arrow_top_right: navigationArrowTopRight,
  open_book: openBook,
  person_swimming_in_water: personSwimmingInWater,
  play_structure_with_slide: playStructureWithSlide,
  shopping_basket: shoppingBasket,
  shopping_cart: shoppingCart,
  square_academic_cap: squareAcademicCap,
  tree_and_bench_with_backrest: treeAndBenchWithBackrest,
  tree_row: treeRow,
  triangle_up_with_exclamation_point: triangleUpWithExclamationPoint,
  womens_and_mens_restroom_symbol: womensAndMensRestroomSymbol,
  wifi,
  x,
};

export function getColoredSvg(name: string, color = 'currentColor'): string {
  const raw = ICON_SVGS[name] ?? ICON_SVGS[DEFAULT_ICON];
  if (!raw) return '';
  return raw.replace('<svg ', `<svg fill="${color}" `);
}
