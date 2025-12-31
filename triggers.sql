-- Create a trigger function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role, full_name, payment_status)
  values (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'role', 'seeker'), 
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'),
    'pending'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Remove old policies that might conflict if any (clean slate for this logic)
drop policy if exists "Users can insert their own profile." on profiles;

-- Create the trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
