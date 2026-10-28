import {getChatGPTUser,chatGPTSignInPath,chatGPTSignOutPath} from '../chatgpt-auth';
import {getAdmin} from '../../lib/admin-auth';
import {readMenu} from '../../lib/store';
import AdminView from './admin-view';
import {Brand} from '../menu-view';
export const dynamic='force-dynamic';
export const metadata={title:'Menü Yönetimi | LOBBY',robots:{index:false,follow:false}};
export default async function AdminPage(){
 const user=await getChatGPTUser(),admin=await getAdmin();
 if(!admin)return <main className="auth-page"><a href="/"><Brand/></a><div className="auth-card"><span className="eyebrow">YÖNETİM ALANI</span><h1>Menü yönetimi</h1><p>{user?'Bu hesabın menüyü düzenleme yetkisi yok. Yetkili hesabınızla giriş yapın.':'Fiyatları ve menü içeriğini düzenlemek için yetkili hesabınızla giriş yapın.'}</p><a className="primary" href={user?chatGPTSignOutPath('/admin'):chatGPTSignInPath('/admin')} target="_top">{user?'Hesaptan çık':'ChatGPT ile giriş yap'}</a><a className="back-link" href="/">Menüye dön</a></div></main>;
 return <AdminView initial={await readMenu()} email={admin.email} signOut={chatGPTSignOutPath('/admin')}/>;
}
