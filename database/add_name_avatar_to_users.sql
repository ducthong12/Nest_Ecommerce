DO $$
DECLARE
  i INT := 1;
BEGIN
  WHILE i <= 1000 LOOP
    INSERT INTO "users"
      ("id", "username", "email", "password", "name", "avatar", "isActive", "createdAt", "updatedAt")
    VALUES
      (
        i,
        'user' || i,
        'user' || i || '@example.com',
        '12345678',
        'User ' || i,
        'https://ui-avatars.com/api/?name=User+' || i || '&background=0D8ABC&color=fff&size=128',
        true,
        NOW(),
        NOW()
      )
    ON CONFLICT ("id") DO NOTHING;

    i := i + 1;
  END LOOP;
END $$;



DO $$
DECLARE
  i INT := 1001;
BEGIN
  WHILE i <= 2000 LOOP
    INSERT INTO "users"
      ("id", "username", "email", "password", "name", "avatar", "isActive", "createdAt", "updatedAt")
    VALUES
      (
        i,
        'shop' || i,
        'shop' || i || '@example.com',
        '12345678',
        'Shop ' || i,
        'https://ui-avatars.com/api/?name=User+' || i || '&background=0D8ABC&color=fff&size=128',
        true,
        NOW(),
        NOW()
      )
    ON CONFLICT ("id") DO NOTHING;

    i := i + 1;
  END LOOP;
END $$;

SELECT 'Migration completed: Added name and avatar fields to users table' as status;