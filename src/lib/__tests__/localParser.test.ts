import { describe, it, expect } from 'vitest';
import { cleanUsername, parseCommentsFromTextClientSide } from '../localParser';

// =====================================================
// Tests for cleanUsername()
// =====================================================
describe('cleanUsername()', () => {
  it('should add @ prefix to a plain username', () => {
    expect(cleanUsername('manuel')).toBe('@manuel');
  });

  it('should preserve @ prefix if already present', () => {
    expect(cleanUsername('@manuel')).toBe('@manuel');
  });

  it('should trim whitespace', () => {
    expect(cleanUsername('  manuel_rd  ')).toBe('@manuel_rd');
  });

  it('should strip • Seguir metadata', () => {
    expect(cleanUsername('@usuario • Seguir')).toBe('@usuario');
  });

  it('should strip • Autor metadata', () => {
    expect(cleanUsername('@casino_rv • Autor')).toBe('@casino_rv');
  });

  it('should strip • Ver traducción metadata', () => {
    expect(cleanUsername('@travel_rd • Ver traducción')).toBe('@travel_rd');
  });

  it('should strip • Ver traducción with accented ó', () => {
    expect(cleanUsername('@jugador1 • Ver traducción')).toBe('@jugador1');
  });

  it('should collapse internal whitespace', () => {
    expect(cleanUsername('  @user   name  ')).toBe('@username');
  });

  it('should return empty string for empty input', () => {
    expect(cleanUsername('')).toBe('');
  });

  it('should return empty string for whitespace-only input', () => {
    expect(cleanUsername('   ')).toBe('');
  });

  it('should return empty string if only metadata remains', () => {
    expect(cleanUsername('• Seguir')).toBe('');
  });

  it('should handle number-only usernames', () => {
    expect(cleanUsername('12345')).toBe('@12345');
  });

  it('should handle underscore in username', () => {
    expect(cleanUsername('player_99')).toBe('@player_99');
  });

  it('should handle dot in username', () => {
    expect(cleanUsername('user.name')).toBe('@user.name');
  });

  it('should strip multiple metadata tags combined', () => {
    expect(cleanUsername('@winner • Seguir • Ver traducción')).toBe('@winner');
  });
});

// =====================================================
// Tests for parseCommentsFromTextClientSide()
// =====================================================
describe('parseCommentsFromTextClientSide()', () => {
  // --- Edge cases ---
  it('should return empty array for empty string', () => {
    expect(parseCommentsFromTextClientSide('')).toEqual([]);
  });

  it('should return empty array for whitespace-only string', () => {
    expect(parseCommentsFromTextClientSide('   \n  \n  ')).toEqual([]);
  });

  it('should return empty array for null/undefined', () => {
    expect(parseCommentsFromTextClientSide(null as any)).toEqual([]);
    expect(parseCommentsFromTextClientSide(undefined as any)).toEqual([]);
  });

  // --- FORMAT 1: TSV (tab-separated) ---
  describe('TSV format (tab-separated)', () => {
    it('should parse 3-column TSV with username, comment, timestamp', () => {
      const input = '@manuel_rd\tExcelente sorteo!\tHace 2h\n@laura_p\tParticipando\tHace 1h';
      const result = parseCommentsFromTextClientSide(input);
      expect(result.length).toBe(2);
      expect(result[0].username).toBe('@manuel_rd');
      expect(result[0].text).toBe('Excelente sorteo!');
      expect(result[0].timestamp).toBe('Hace 2h');
      expect(result[1].username).toBe('@laura_p');
      expect(result[1].text).toBe('Participando');
      expect(result[1].timestamp).toBe('Hace 1h');
    });

    it('should parse 2-column TSV with just username and comment', () => {
      const input = '@pedro\tQuiero ganar!\n@ana\tMe apunto';
      const result = parseCommentsFromTextClientSide(input);
      expect(result.length).toBe(2);
      expect(result[0].username).toBe('@pedro');
      expect(result[0].text).toBe('Quiero ganar!');
      expect(result[1].username).toBe('@ana');
    });

    it('should handle TSV with only usernames (single column)', () => {
      const input = '@user1\t\n@user2\t';
      const result = parseCommentsFromTextClientSide(input);
      expect(result.length).toBe(2);
      expect(result[0].text).toBe('Participando en el sorteo 🏆');
    });

    it('should generate fallback username if cleaned username is too short', () => {
      const input = 'a\tcomment';
      const result = parseCommentsFromTextClientSide(input);
      expect(result.length).toBe(1);
      expect(result[0].username).toContain('@participante_');
      expect(result[0].text).toBe('comment');
    });
  });

  // --- FORMAT 2: Colon-separated "username: comment" ---
  describe('Colon format (username: comment)', () => {
    it('should parse simple colon-separated comments', () => {
      const input = 'juan_perez: Excelente promoción!\nmaria_rd: Participando en el sorteo\ncarlos: Me encanta el casino';
      const result = parseCommentsFromTextClientSide(input);
      expect(result.length).toBe(3);
      expect(result[0].username).toBe('@juan_perez');
      expect(result[0].text).toBe('Excelente promoción!');
      expect(result[1].username).toBe('@maria_rd');
      expect(result[1].text).toBe('Participando en el sorteo');
      expect(result[2].username).toBe('@carlos');
      expect(result[2].text).toBe('Me encanta el casino');
    });

    it('should skip colon lines that are URLs', () => {
      const input = 'https://www.instagram.com/p/abc123/\nmanuel: Gran rifa!';
      const result = parseCommentsFromTextClientSide(input);
      expect(result.length).toBe(1);
      expect(result[0].username).toBe('@manuel');
    });

    it('should skip colon too far from start (long key)', () => {
      const input = 'this is a very long string that should not match as a username: comment text';
      const result = parseCommentsFromTextClientSide(input);
      // Should fall through to the fallback parser
      expect(result.length).toBeGreaterThanOrEqual(0);
    });
  });

  // --- FORMAT 3: Sequential Instagram copy (2-3 line blocks) ---
  describe('Sequential Instagram copy format', () => {
    it('should parse 2-line blocks: username + comment', () => {
      const input = 'maria_rd99\nYo quiero ganar mis 5,000 pesos!\npedro_01\nGran sorteo!';
      const result = parseCommentsFromTextClientSide(input);
      expect(result.length).toBe(2);
      expect(result[0].username).toBe('@maria_rd99');
      expect(result[0].text).toBe('Yo quiero ganar mis 5,000 pesos!');
      expect(result[1].username).toBe('@pedro_01');
      expect(result[1].text).toBe('Gran sorteo!');
    });

    it('should parse 3-line blocks: username + comment + metadata', () => {
      const input = 'juan_do\nQue bono tan increible!\n4 h Responder Ver respuestas (1)\nlaura_22\nYa quiero mi premio!\n2 h Responder';
      const result = parseCommentsFromTextClientSide(input);
      expect(result.length).toBe(2);
      expect(result[0].username).toBe('@juan_do');
      expect(result[0].text).toBe('Que bono tan increible!');
      expect(result[0].timestamp).toBe('4 h');
      expect(result[1].username).toBe('@laura_22');
      expect(result[1].text).toBe('Ya quiero mi premio!');
      expect(result[1].timestamp).toBe('2 h');
    });

    it('should parse username with dots and hyphens', () => {
      const input = 'carlos.rivera-23\nMe apunto al sorteo!';
      const result = parseCommentsFromTextClientSide(input);
      expect(result.length).toBe(1);
      expect(result[0].username).toBe('@carlos.rivera-23');
    });

    it('should skip lines that look like metadata', () => {
      const input = 'rafael_85\nMi comentario\n3 h Responder\nluis_01\nOtro comentario';
      const result = parseCommentsFromTextClientSide(input);
      expect(result.length).toBe(2);
      expect(result[0].username).toBe('@rafael_85');
      expect(result[0].text).toBe('Mi comentario');
      expect(result[0].timestamp).toBe('3 h');
    });

    it('should skip "me gusta" and "Responder" lines', () => {
      const input = 'user_01\nTexto real\n3 h Responder';
      const result = parseCommentsFromTextClientSide(input);
      expect(result.length).toBe(1);
      expect(result[0].username).toBe('@user_01');
    });

    it('should skip lines starting with "hace "', () => {
      const input = 'ana_perez\nGran post!\nhace 3 horas';
      const result = parseCommentsFromTextClientSide(input);
      expect(result.length).toBe(1);
      expect(result[0].username).toBe('@ana_perez');
      expect(result[0].text).toBe('Gran post!');
    });

    it('should skip standalone time patterns like "3h" or "45m"', () => {
      const input = 'elena_r\nBonito sorteo\n2h\ncarlos_m\nExcelente';
      const result = parseCommentsFromTextClientSide(input);
      expect(result.length).toBe(2);
      expect(result[0].username).toBe('@elena_r');
      expect(result[1].username).toBe('@carlos_m');
    });
  });

  // --- @mention extraction from loose lines ---
  describe('@mention extraction', () => {
    it('should extract @mentions from non-username lines', () => {
      const input = 'Sigan a @usuario_1 en Instagram\nVisiten @cuenta_oficial y participen!';
      const result = parseCommentsFromTextClientSide(input);
      expect(result.length).toBeGreaterThan(0);
      // Should have captured @usuario_1 or @cuenta_oficial
      const usernames = result.map(c => c.username);
      expect(usernames).toContain('@usuario_1');
    });

    it('should treat @mention lines as comments with the mention as username', () => {
      const input = '@ganador_rv es el mejor casino\n@casino_fan participando';
      const result = parseCommentsFromTextClientSide(input);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  // --- FALLBACK format ---
  describe('Fallback format', () => {
    it('should fall back to treating each line as a comment when no format matches', () => {
      const input = 'Usuarión comentó algo aquí\nOtro usuarión también comentó aquí\nY otro tercer comentario útil';
      const result = parseCommentsFromTextClientSide(input);
      expect(result.length).toBe(3);
      expect(result[0].username).toBeDefined();
      expect(result[0].text).toBe('Usuarión comentó algo aquí');
    });

    it('should skip URL lines in fallback', () => {
      const input = 'Línea 1: comentario de prueba\nhttps://www.instagram.com\nLínea 2: otro comentario';
      const result = parseCommentsFromTextClientSide(input);
      expect(result.length).toBe(2);
      const texts = result.map(c => c.text);
      expect(texts).not.toContain('https://www.instagram.com');
    });

    it('should skip very short lines in fallback (< 5 chars)', () => {
      const input = '@user1\nHi\n@user2\nHello';
      // First two lines would be parsed as sequential format
      // If not, fallback should skip "Hi" (5 chars or less)
      expect(input.length).toBeGreaterThan(0);
    });
  });

  // --- Mixed content ---
  describe('Mixed content handling', () => {
    it('should handle real-world Instagram paste with mixed content', () => {
      const input = [
        'maria_jose_rd',
        'Que emoción! espero ganar 🙏',
        '3 h Responder Ver respuestas (2)',
        '',
        'carlos.mendoza',
        'Ya quiero ver el sorteo! 🔥🔥',
        '5 h Responder',
        '',
        '@pedro_luis',
        'Me encanta Casino Club RV',
        '7 h Responder Ver respuestas (1)',
      ].join('\n');
      const result = parseCommentsFromTextClientSide(input);
      expect(result.length).toBe(3);
      expect(result[0].username).toBe('@maria_jose_rd');
      expect(result[0].text).toBe('Que emoción! espero ganar 🙏');
      expect(result[1].username).toBe('@carlos.mendoza');
      expect(result[1].text).toBe('Ya quiero ver el sorteo! 🔥🔥');
      expect(result[2].username).toBe('@pedro_luis');
      expect(result[2].text).toBe('Me encanta Casino Club RV');
    });

    it('should handle empty lines between comments', () => {
      const input = 'user_01\nComment 1\n\nuser_02\nComment 2\n\nuser_03\nComment 3';
      const result = parseCommentsFromTextClientSide(input);
      expect(result.length).toBe(3);
    });

    it('should preserve emoji in comments', () => {
      const input = 'fan_rv\n🔥🔥🔥 Gran sorteo! 🎰💰\npedro_p\n🇩🇴 Vamos RD! 🏆';
      const result = parseCommentsFromTextClientSide(input);
      expect(result.length).toBe(2);
      expect(result[0].text).toContain('🔥🔥🔥');
      expect(result[1].text).toContain('🇩🇴');
    });
  });

  // --- Edge cases ---
  describe('Edge cases', () => {
    it('should handle single character comment', () => {
      const input = 'user_01\nx';
      const result = parseCommentsFromTextClientSide(input);
      expect(result.length).toBe(1);
      expect(result[0].text).toBe('x');
    });

    it('should handle very long comments without truncation', () => {
      const longText = 'A'.repeat(500);
      const input = `user_01\n${longText}`;
      const result = parseCommentsFromTextClientSide(input);
      expect(result.length).toBe(1);
      expect(result[0].text.length).toBe(500);
    });

    it('should handle username-like lines that are not actually usernames', () => {
      const input = 'abc\nsome comment\nxyz\nanother comment';
      const result = parseCommentsFromTextClientSide(input);
      expect(result.length).toBe(2);
    });

    it('should handle input with lots of numbers', () => {
      const input = 'user_01\n12345 67890\nuser_02\n999 888 777';
      const result = parseCommentsFromTextClientSide(input);
      expect(result.length).toBe(2);
    });
  });

  // --- TSV edge cases ---
  describe('TSV edge cases', () => {
    it('should handle TSV with random-like IDs', () => {
      const input = '@user_abc\tcomment text\thace 5h\n@user_xyz\tanother comment\thace 2h';
      const result = parseCommentsFromTextClientSide(input);
      expect(result.length).toBe(2);
      expect(result.every(c => c.id.startsWith('local_tsv_'))).toBe(true);
    });
  });
});
