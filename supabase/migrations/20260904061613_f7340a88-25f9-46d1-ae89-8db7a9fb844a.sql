CREATE TYPE public.app_role AS ENUM ('admin','editor');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile write" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL DEFAULT '',
  featured_image TEXT,
  author TEXT NOT NULL DEFAULT 'Ammikulavi Estate',
  category TEXT NOT NULL DEFAULT 'Estate Life',
  tags TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT SELECT ON public.blog_posts TO anon;
GRANT ALL ON public.blog_posts TO service_role;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read published posts" ON public.blog_posts FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "admins read all posts" ON public.blog_posts FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins write posts" ON public.blog_posts FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins update posts" ON public.blog_posts FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins delete posts" ON public.blog_posts FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER blog_posts_updated_at BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_url TEXT NOT NULL,
  storage_path TEXT,
  file_type TEXT NOT NULL DEFAULT 'image',
  title TEXT,
  caption TEXT,
  alt_text TEXT,
  category TEXT NOT NULL DEFAULT 'Estate Life',
  featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media TO authenticated;
GRANT SELECT ON public.media TO anon;
GRANT ALL ON public.media TO service_role;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read media" ON public.media FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins insert media" ON public.media FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins update media" ON public.media FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins delete media" ON public.media FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.site_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (page, key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
GRANT SELECT ON public.site_content TO anon;
GRANT ALL ON public.site_content TO service_role;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read content" ON public.site_content FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins insert content" ON public.site_content FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins update content" ON public.site_content FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins delete content" ON public.site_content FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER site_content_updated_at BEFORE UPDATE ON public.site_content FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT SELECT, DELETE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can send a message" ON public.contact_messages FOR INSERT TO anon, authenticated WITH CHECK (char_length(message) BETWEEN 1 AND 4000 AND char_length(name) BETWEEN 1 AND 120);
CREATE POLICY "admins read messages" ON public.contact_messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins delete messages" ON public.contact_messages FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

INSERT INTO public.site_content (page, key, value) VALUES
('home','hero_headline','From the Estate to Every Cup.'),
('home','hero_subline','Cultivating exceptional coffee and pepper amidst the richness of nature.'),
('home','intro_heading','Rooted in Nature. Crafted with Care.'),
('home','intro_body','Ammikulavi Estate rests in the shade of old rainforest canopy, where mist settles into the valleys each morning and the soil carries generations of care. Every cherry and every peppercorn is grown slowly, picked by hand, and finished with patience.'),
('about','heading','Rooted in Nature. Crafted with Care.'),
('about','history','The estate began as a modest smallholding, planted under native shade trees and tended by a single family. Over decades it grew outward rather than upward — never clearing more than the land could carry, never rushing what the seasons decide.'),
('about','location','Set at elevation among rolling hills, the estate is cooled by monsoon winds and warmed by long, gentle afternoons. Streams thread through the plantation, and native birds return each year to the same trees.'),
('about','philosophy','We believe flavour is a record of place. Soil, altitude, shade and rainfall write themselves into the cup, so our work is mostly restraint: protect the ecosystem, harvest at the right moment, and let the estate speak.'),
('coffee','heading','Specialty Coffee, Grown in Shade.'),
('coffee','overview','Our coffee is grown under native canopy at elevation, allowing cherries to ripen slowly and develop depth. We cultivate selected Arabica varieties alongside heritage Robusta, each block picked selectively across several passes.'),
('coffee','varieties','Selection 9, Chandragiri, Kent and heritage Robusta.'),
('coffee','altitude','1,050 – 1,300 metres above sea level'),
('coffee','processing','Washed, natural and honey processing, all sun-dried on raised beds.'),
('coffee','flavour','Cocoa and dark caramel, with orange blossom, stone fruit and a rounded, syrupy finish.'),
('pepper','heading','The Spice of the Estate.'),
('pepper','overview','Pepper vines climb the shade trees between our coffee blocks, drawing on the same soil and mist. Harvested by hand and sun-dried in small lots, the result is a pepper with heat that opens slowly and lingers.'),
('pepper','cultivation','Vines are trained on living support trees, mulched with estate compost and never forced.'),
('pepper','flavour','Bright citrus lift, resinous pine, deep woody heat.'),
('sustainability','heading','Growing With Nature, Not Against It.'),
('sustainability','body','Shade-grown cultivation keeps the canopy intact, and the canopy keeps everything else alive: birds, pollinators, soil microbes, the streams that feed the valley. We compost estate waste, recycle processing water, and leave wild corridors untouched.'),
('contact','email','ammikfarms@gmail.com'),
('contact','phone','+91 00000 00000'),
('contact','address','Ammikulavi Estate, Coffee Country, India'),
('contact','instagram','https://instagram.com');