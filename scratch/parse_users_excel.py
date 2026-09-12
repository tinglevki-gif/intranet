import pandas as pd
import json

df = pd.read_excel('Users.xlsx')
print(f"Total rows: {len(df)}")
print("Columns:", df.columns.tolist())
users = []
for idx, row in df.iterrows():
    users.append(row.to_dict())

with open('scratch_users.json', 'w', encoding='utf-8') as f:
    json.dump(users, f, ensure_ascii=False, indent=2, default=str)

print("Saved scratch_users.json successfully!")
