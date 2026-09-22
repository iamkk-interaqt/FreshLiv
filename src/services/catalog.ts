import { supabase } from '../lib/supabase';
import type { CustomerLocation } from '../types/marketplace';
export type CatalogProduct={key:string;label:string;emoji:string;category:string};
const EMOJI:Record<string,string>={MILK:'🥛',PREMIUM_MILK:'🥛',PANEER:'🧀',CURD:'🥣',BUTTER:'🧈',GHEE:'🫙',KHOYA_MAWA:'🍮',CHICKEN:'🍗',MUTTON:'🍖',FISH:'🐟',EGG:'🥚'};
const LABEL:Record<string,string>={MILK:'Milk',PREMIUM_MILK:'Premium Milk',PANEER:'Paneer',CURD:'Curd',BUTTER:'Butter',GHEE:'Ghee',KHOYA_MAWA:'Khoya / Mawa',CHICKEN:'Chicken',MUTTON:'Mutton',FISH:'Fish',EGG:'Eggs'};
export async function findAvailableCustomerProducts(location:CustomerLocation):Promise<CatalogProduct[]>{
 const postal=location.postalCode?.trim(), locality=location.locality?.trim(); if(!postal&&!locality)return [];
 let areas:any[]=[]; if(postal){const r=await supabase.from('dairywala_service_areas').select('dairywala_id').eq('postal_code',postal);if(r.error)throw r.error;areas=r.data??[]}
 if(!areas.length&&locality){const r=await supabase.from('dairywala_service_areas').select('dairywala_id').ilike('locality',locality);if(r.error)throw r.error;areas=r.data??[]}
 const ids=[...new Set(areas.map(x=>x.dairywala_id))];if(!ids.length)return [];
 const {data:profiles,error:pe}=await supabase.from('dairywala_profiles').select('id').in('id',ids).eq('status','ACTIVE');if(pe)throw pe;const active=(profiles??[]).map(x=>x.id);if(!active.length)return [];
 const {data,error}=await supabase.from('products').select('product_category,name').in('dairywala_id',active).eq('status','ACTIVE');if(error)throw error;
 const seen=new Set<string>();const result:CatalogProduct[]=[];
 for(const row of data??[]){const category=String(row.product_category??'').trim().toUpperCase();if(!category||seen.has(category))continue;seen.add(category);result.push({key:category,label:LABEL[category]??String(row.name??category),emoji:EMOJI[category]??'🛒',category})}
 return result.sort((a,b)=>a.label.localeCompare(b.label));
}
