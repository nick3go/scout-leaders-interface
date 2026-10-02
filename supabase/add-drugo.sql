-- Dodaj možnost "Drugo" med vrste opravljenih srečanj.
alter table srecanje
drop constraint if exists srecanje_vrsta_check;

alter table srecanje
add constraint srecanje_vrsta_check
check (
  vrsta in ('Znanje', 'Zabavno', 'Ustvarjalno', 'Povezovalno', 'Drugo')
);
