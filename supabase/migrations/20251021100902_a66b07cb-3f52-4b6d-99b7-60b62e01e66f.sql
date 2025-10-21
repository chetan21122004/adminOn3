-- Grant admin role to the user
INSERT INTO public.user_roles (user_id, role)
VALUES ('bfcf45d8-7e02-4952-910d-762545274d43', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;