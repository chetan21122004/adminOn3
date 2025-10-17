-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Only admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Update all existing RLS policies to use has_role function
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products"
ON public.products FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage product images" ON public.product_images;
CREATE POLICY "Admins can manage product images"
ON public.product_images FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage product variants" ON public.product_variants;
CREATE POLICY "Admins can manage product variants"
ON public.product_variants FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories"
ON public.categories FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage collections" ON public.collections;
CREATE POLICY "Admins can manage collections"
ON public.collections FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage blogs" ON public.blogs;
CREATE POLICY "Admins can manage blogs"
ON public.blogs FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage admin settings" ON public.admin_settings;
CREATE POLICY "Admins can manage admin settings"
ON public.admin_settings FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage discount codes" ON public.discount_codes;
CREATE POLICY "Admins can manage discount codes"
ON public.discount_codes FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage virtual keypad codes" ON public.virtual_keypad_codes;
CREATE POLICY "Admins can manage virtual keypad codes"
ON public.virtual_keypad_codes FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view contact messages" ON public.contact_messages;
CREATE POLICY "Admins can view contact messages"
ON public.contact_messages FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders"
ON public.orders FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders"
ON public.orders FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Update handle_new_user to assign default user role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO users (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    
    -- Assign default 'user' role
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    RETURN NEW;
END;
$$;