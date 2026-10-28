import MenuView from './menu-view';
import {readMenu} from '../lib/store';
export const dynamic='force-dynamic';
export default async function Home(){return <MenuView initial={await readMenu()}/>;}
