import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey } from './supabaseConfig';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const adminId = crypto.randomUUID();
  
  const { data, error } = await supabase.from('usuarios').insert([
    {
      id: adminId,
      nome: 'LEVI',
      cargo: 'Gerente',
      pin: '8660',
      data_criacao: new Date().toISOString()
    }
  ]);

  if (error) {
    console.error('Erro ao inserir usuario:', error);
  } else {
    console.log('Usuario LEVI inserido com sucesso!');
  }
}

run();
