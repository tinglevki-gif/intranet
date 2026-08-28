import sqlite3

def run_update():
    con = sqlite3.connect('intranet.db')
    cur = con.cursor()

    users = dict(cur.execute('SELECT full_name, id FROM users').fetchall())

    anja_id = users.get('Anja Knoll', 2)
    robert_id = users.get('Robert Kuhaupt', 37)
    petra_id = users.get('Petra Petersen', 7)
    matthias_id = users.get('Matthias Grade', 28)
    susanne_id = users.get('Susanne Merten', 5)
    humbert_id = users.get('Humbert Senf', 38)

    cur.execute('UPDATE announcements SET author_name = ?, author_id = ? WHERE id = 1 OR title LIKE "%Willkommen%"', ('Anja Knoll', anja_id))
    cur.execute('UPDATE announcements SET author_name = ?, author_id = ? WHERE id = 2 OR title LIKE "%IT-Sicherheit%"', ('Robert Kuhaupt', robert_id))
    cur.execute('UPDATE announcements SET author_name = ?, author_id = ? WHERE id = 3 OR title LIKE "%Urlaubsplanung%"', ('Petra Petersen', petra_id))
    cur.execute('UPDATE announcements SET author_name = ?, author_id = ? WHERE id = 4 OR title LIKE "%Fertigungshalle%"', ('Matthias Grade', matthias_id))
    cur.execute('UPDATE announcements SET author_name = ?, author_id = ? WHERE id = 5 OR title LIKE "%Frühlingsevent%"', ('Susanne Merten', susanne_id))

    # Update Humbert Senf avatar to male executive portrait
    cur.execute('UPDATE users SET avatar_url = ? WHERE full_name = ?', ('https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&auto=format&fit=crop&q=80', 'Humbert Senf'))

    con.commit()
    rows = cur.execute('SELECT id, author_name, author_id FROM announcements').fetchall()
    for r in rows:
        print(f"Announcement #{r[0]}: author='{r[1]}', author_id={r[2]}")

    con.close()
    print("Announcements authors updated successfully.")

if __name__ == '__main__':
    run_update()
