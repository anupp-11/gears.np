import Link from "next/link";
import Image from "next/image";
import { supabaseServer } from "@/lib/supabase/server";
import { ProductCard } from "@/components/store/ProductCard";
import { TeamCard } from "@/components/store/TeamCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Trophy, Calendar, MapPin, Ticket } from "lucide-react";

export default async function HomePage() {
  const supabase = await supabaseServer();

  // Fetch settings for hero banner and branding
  const { data: settings } = await supabase
    .from("settings")
    .select("site_name, logo_url, banner_image_url, primary_color, hero_title, promo_text, show_hero_banner")
    .eq("id", 1)
    .single();
  // Fetch featured products, fallback to latest if none featured
  let { data: featuredProducts} = await supabase
    .from("products")
    .select(`
      *,
      teams!inner(*),
      product_images(image_url, sort_order)
    `)
    .eq("is_featured", true)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(8);

  // If no featured products, get latest products
  if (!featuredProducts || featuredProducts.length === 0) {
    const { data: latestProducts, error: latestError } = await supabase
      .from("products")
      .select(`
        *,
        teams!inner(*),
        product_images(image_url, sort_order)
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(8);
    
    console.log('Latest query error:', latestError);
    console.log('Latest Products:', latestProducts?.length || 0);
    featuredProducts = latestProducts;
  }

  // Fetch homepage promotional banners
  const { data: homepageBanners } = await supabase
    .from("homepage_banners")
    .select("*")
    .eq("is_active", true)
    .order("position");

  // Fetch upcoming events (max 3)
  const { data: upcomingEvents } = await supabase
    .from("events")
    .select("id, title, slug, description, location, event_date, banner_image_url, is_ticketed, ticket_price")
    .eq("is_active", true)
    .gte("event_date", new Date().toISOString())
    .order("event_date", { ascending: true })
    .limit(3);

  // Fetch all teams with product counts
  const { data: teams } = await supabase
    .from("teams")
    .select(`
      *,
      products:products(count)
    `)
    .eq("is_active", true)
    .order("name");

  const teamsWithCount = teams?.map(team => ({
    ...team,
    _count: { products: team.products[0].count }
  }));

  const showHero = settings?.show_hero_banner !== false;

  return (
    <div>
      {/* Announcement Banner - Only on Home Page */}
      {settings?.promo_text && (
        <div className="bg-[#e10600] text-white py-1 px-4 text-center text-xs md:text-sm font-medium">
          <div className="container mx-auto flex items-center justify-center gap-1">
            <span>{settings.promo_text}</span>
          </div>
        </div>
      )}
      
      {/* Hero Section */}
      {showHero && (
      <section className="relative h-[260px] md:h-[500px] bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden">
        {settings?.banner_image_url ? (
          <Image
            src={settings.banner_image_url}
            alt="Hero Banner"
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
        )}

        {/* Dark gradient overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 container mx-auto px-4 pb-5 flex flex-col md:flex-row items-end md:items-end justify-between gap-3">
          {/* Next event teaser */}
          {upcomingEvents && upcomingEvents[0] && (() => {
            const next = upcomingEvents[0];
            const d = new Date(next.event_date);
            return (
              <Link href={`/events/${next.slug}`} className="group">
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2.5 hover:bg-white/20 transition-colors">
                  {/* Date block */}
                  <div className="bg-[#e10600] rounded-lg px-2 py-1 text-center shrink-0">
                    <p className="text-[10px] font-bold text-white uppercase leading-none">
                      {d.toLocaleString("en-NP", { month: "short" })}
                    </p>
                    <p className="text-lg font-black text-white leading-none">{d.getDate()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-[#e10600] uppercase tracking-wide mb-0.5">
                      Upcoming Event
                    </p>
                    <p className="text-white font-bold text-sm leading-tight line-clamp-1">
                      {next.title}
                    </p>
                    {next.location && (
                      <p className="text-white/60 text-xs mt-0.5 flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {next.location}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-white/50 group-hover:text-white shrink-0 transition-colors" />
                </div>
              </Link>
            );
          })()}

          {/* Shop Now button */}
          <Link href="/shop" className="shrink-0">
            <Button className="bg-[#e10600] hover:bg-[#c00500] shadow-2xl">
              Shop Now <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
      )}

      {/* Promotional Banners */}
      {homepageBanners && homepageBanners.length > 0 && (
        <section className="grid grid-cols-1 sm:grid-cols-2">
          {homepageBanners.map((banner: { position: number; image_url: string | null; title: string; button_text: string; button_link: string }) => (
            <div key={banner.position} className="relative overflow-hidden h-[430px] sm:h-[calc(100vh-64px)] bg-gray-900 group">

              {banner.image_url && (
                <Image
                  src={banner.image_url}
                  alt={banner.title || `Banner ${banner.position}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6 md:p-8">
                {banner.title && (
                  <h3 className="text-white font-bold text-xl md:text-2xl mb-3 drop-shadow">
                    {banner.title}
                  </h3>
                )}
                <Link href={banner.button_link}>
                  <button className="bg-white text-black px-5 py-2 rounded-full text-sm font-semibold hover:bg-gray-100 transition-colors">
                    {banner.button_text}
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Featured Products */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 text-[#e10600] mb-2">
                <TrendingUp className="h-5 w-5" />
                <span className="text-sm font-semibold uppercase tracking-wide">Featured</span>
              </div>
              <h2 className="text-3xl font-bold">
                {featuredProducts?.some((p: { is_featured: boolean }) => p.is_featured) ? 'Popular Products' : 'Latest Products'}
              </h2>
            </div>
            <Link href="/shop">
              <Button variant="outline">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          {featuredProducts && featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {featuredProducts.map((product: any) => {
                return (
                  <ProductCard
                    key={product.id}
                    product={{
                      ...product,
                      team: product.teams,
                    }}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products available yet. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* Upcoming Events */}
      {upcomingEvents && upcomingEvents.length > 0 && (
        <section className="py-16 bg-gray-950 text-white">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 text-[#e10600] mb-2">
                  <Calendar className="h-5 w-5" />
                  <span className="text-sm font-semibold uppercase tracking-wide">Upcoming</span>
                </div>
                <h2 className="text-3xl font-bold">Events & Watch Parties</h2>
              </div>
              <Link href="/events">
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 hover:text-white">
                  All Events <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {upcomingEvents.map((event: any) => {
                const date = new Date(event.event_date);
                const isFree = event.is_ticketed && (Number(event.ticket_price ?? 0) === 0);
                return (
                  <Link href={`/events/${event.slug}`} key={event.id}>
                    <div className="group bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-[#e10600]/60 hover:bg-white/8 transition-all cursor-pointer h-full flex flex-col">
                      {/* Banner */}
                      <div className="relative h-44 bg-gray-800 shrink-0">
                        {event.banner_image_url ? (
                          <Image
                            src={event.banner_image_url}
                            alt={event.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Calendar className="h-12 w-12 text-white/20" />
                          </div>
                        )}
                        {/* Date badge */}
                        <div className="absolute top-3 left-3 bg-[#e10600] text-white rounded-lg px-2.5 py-1 text-center leading-tight">
                          <p className="text-xs font-semibold uppercase">{date.toLocaleString("en-NP", { month: "short" })}</p>
                          <p className="text-xl font-bold leading-none">{date.getDate()}</p>
                        </div>
                        {/* Ticket badge */}
                        {event.is_ticketed && (
                          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold rounded-full px-2.5 py-1 flex items-center gap-1">
                            <Ticket className="h-3 w-3" />
                            {isFree ? "Free" : `NPR ${Number(event.ticket_price).toLocaleString()}`}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4 flex flex-col flex-1">
                        <h3 className="font-bold text-base mb-1 group-hover:text-[#e10600] transition-colors line-clamp-2">
                          {event.title}
                        </h3>
                        <div className="flex flex-col gap-1 text-xs text-white/50 mb-3">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 shrink-0" />
                            {date.toLocaleDateString("en-NP", { weekday: "short", month: "long", day: "numeric" })}
                            {" · "}
                            {date.toLocaleTimeString("en-NP", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {event.location && (
                            <span className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 shrink-0" />
                              {event.location}
                            </span>
                          )}
                        </div>
                        {event.description && (
                          <p className="text-xs text-white/40 line-clamp-2 mb-3">{event.description}</p>
                        )}
                        <div className="mt-auto">
                          {event.is_ticketed ? (
                            <span className="text-xs font-semibold text-[#e10600] group-hover:underline">
                              Book Tickets →
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-white/50 group-hover:text-white/80">
                              View Details →
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Teams Section */}
      {teamsWithCount && teamsWithCount.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-2 text-[#e10600] mb-2">
                <Trophy className="h-5 w-5" />
                <span className="text-sm font-semibold uppercase tracking-wide">Teams</span>
              </div>
              <h2 className="text-3xl font-bold mb-4">Shop by Your Favorite Team</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Support your team with official merchandise and exclusive gear
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {teamsWithCount.slice(0, 10).map((team) => (
                <TeamCard key={team.id} team={team} />
              ))}
            </div>
            {teamsWithCount.length > 10 && (
              <div className="text-center mt-8">
                <Link href="/teams">
                  <Button variant="outline" size="lg">
                    View All Teams <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <Trophy className="h-16 w-16 mx-auto mb-6 text-[#e10600]" />
          <h2 className="text-4xl font-bold mb-4">Join the Racing Community</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Get exclusive access to limited edition merchandise, special offers, and latest F1 updates
          </p>
          <Link href="/shop">
            <Button size="lg" className="bg-[#e10600] hover:bg-[#c00500]">
              Start Shopping <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
