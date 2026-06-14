import { isMissingNotepadTable } from '@/lib/account/notepad-storage';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('user_notepad')
      .select('content, updated_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return NextResponse.json({
        notepad: { content: '', updatedAt: null },
      });
    }

    return NextResponse.json({
      notepad: {
        content: data.content ?? '',
        updatedAt: data.updated_at,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur bloc-notes';
    if (isMissingNotepadTable(message)) {
      return NextResponse.json(
        {
          error: 'Table bloc-notes absente. Exécutez supabase/migrations/003_user_notepad.sql',
          code: 'TABLES_MISSING',
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
    }

    const body = await request.json();
    const content = typeof body.content === 'string' ? body.content : '';

    const { data, error } = await supabase
      .from('user_notepad')
      .upsert(
        {
          user_id: user.id,
          content,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select('content, updated_at')
      .single();

    if (error) throw error;

    return NextResponse.json({
      notepad: {
        content: data.content,
        updatedAt: data.updated_at,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur sauvegarde';
    if (isMissingNotepadTable(message)) {
      return NextResponse.json(
        { error: message, code: 'TABLES_MISSING' },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
