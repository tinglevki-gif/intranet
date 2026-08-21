import React, { useState } from 'react';
import { 
  UtensilsCrossed, 
  Coffee, 
  Clock, 
  Leaf, 
  Flame, 
  Euro, 
  Calendar, 
  ShoppingBag, 
  CheckCircle2, 
  Sparkles,
  Info,
  ChevronRight
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function KantinePage() {
  const { t } = useLanguage();
  const [selectedDay, setSelectedDay] = useState('HEUTE');
  const [orderedItem, setOrderedItem] = useState(null);
  const [pickupTime, setPickupTime] = useState('12:30');

  const weekDays = [
    { key: 'MO', label: 'Montag', date: '24. Aug' },
    { key: 'HEUTE', label: 'Dienstag (Heute)', date: '25. Aug', isToday: true },
    { key: 'MI', label: 'Mittwoch', date: '26. Aug' },
    { key: 'DO', label: 'Donnerstag', date: '27. Aug' },
    { key: 'FR', label: 'Freitag', date: '28. Aug' },
  ];

  const menuItems = {
    HEUTE: [
      {
        id: 1,
        title: 'Dänischer Rinderbraten mit Wurzelgemüse',
        category: 'Tagesgericht 1',
        description: 'Zart geschmorter Rinderbraten an Rosmarin-Jus, serviert mit Apfel-Rotkohl und Kartoffelgratin.',
        price: '7,50 €',
        guestPrice: '9,80 €',
        calories: '680 kcal',
        isVeggie: false,
        isChefChoice: true,
        allergens: ['Laktose', 'Sellerie'],
        image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
      },
      {
        id: 2,
        title: 'Cremiges Waldpilz-Risotto (Vegetarisch)',
        category: 'Veggie & Vital',
        description: 'Frische Pfifferlinge und Kräuterseitlinge mit Grana Padano, frischem Thymian und Rucola-Topping.',
        price: '6,20 €',
        guestPrice: '8,50 €',
        calories: '520 kcal',
        isVeggie: true,
        isChefChoice: false,
        allergens: ['Laktose'],
        image: 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?w=600&auto=format&fit=crop&q=80',
      },
      {
        id: 3,
        title: 'Tiglev Fitness-Bowl mit gebratenem Lachs',
        category: 'Light & Fresh',
        description: 'Quinoa, Edamame, Babyspinat, Granatapfelkerne, Avocado und gegrilltes Lachsfilet mit Zitronen-Dressing.',
        price: '8,90 €',
        guestPrice: '11,20 €',
        calories: '490 kcal',
        isVeggie: false,
        isChefChoice: false,
        allergens: ['Fisch', 'Sesam'],
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
      }
    ],
    MO: [
      {
        id: 4,
        title: 'Klassisches Hähnchenschnitzel Wiener Art',
        category: 'Klassiker',
        description: 'Knusprig paniertes Hähnchenbrustfilet mit Zitrone, Pommes Frites oder Kartoffelsalat und Preiselbeeren.',
        price: '6,90 €',
        guestPrice: '9,20 €',
        calories: '740 kcal',
        isVeggie: false,
        isChefChoice: false,
        allergens: ['Gluten', 'Ei'],
        image: 'https://images.unsplash.com/photo-1599921841143-819065a55cc6?w=600&auto=format&fit=crop&q=80',
      }
    ],
    MI: [
      {
        id: 5,
        title: 'Hausgemachte Lasagne al Forno',
        category: 'Pasta & More',
        description: 'Mit 100% Rinderhackfleisch, Béchamelsauce und herzhaftem Gouda überbacken.',
        price: '6,80 €',
        guestPrice: '8,90 €',
        calories: '690 kcal',
        isVeggie: false,
        isChefChoice: true,
        allergens: ['Gluten', 'Laktose'],
        image: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=600&auto=format&fit=crop&q=80',
      }
    ],
    DO: [
      {
        id: 6,
        title: 'Nordische Fischsuppe mit Safran & Knoblauchbrot',
        category: 'Fischspezialität',
        description: 'Kabeljau und Lachsfilet in feinem Weißwein-Safran-Fond mit Gemüsestreifen.',
        price: '7,90 €',
        guestPrice: '9,90 €',
        calories: '450 kcal',
        isVeggie: false,
        isChefChoice: true,
        allergens: ['Fisch', 'Gluten', 'Sellerie'],
        image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80',
      }
    ],
    FR: [
      {
        id: 7,
        title: 'Traditioneller Burger-Freitag: Tiglev BBQ Bacon Burger',
        category: 'Burger & Grill',
        description: 'Saftiges Black Angus Beef, knuspriger Bacon, Cheddar, Röstzwiebeln und Süßkartoffelpommes.',
        price: '8,20 €',
        guestPrice: '10,50 €',
        calories: '820 kcal',
        isVeggie: false,
        isChefChoice: true,
        allergens: ['Gluten', 'Laktose', 'Senf'],
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
      }
    ]
  };

  const handleOrder = (dish) => {
    setOrderedItem(dish);
  };

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Kantine & Betriebsrestaurant</h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Täglich frischer Speiseplan, Menüvorbestellung & Öffnungszeiten am Standort Tinglev
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs font-semibold text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
          <Clock className="w-4 h-4 text-emerald-600" />
          <div>
            <p className="font-bold text-slate-900">Mittagstisch: 11:30 – 14:00 Uhr</p>
            <p className="text-[11px] text-slate-400">Frühstück & Snacks: 07:30 – 10:30 Uhr</p>
          </div>
        </div>
      </div>

      {/* Week Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {weekDays.map((day) => (
          <button
            key={day.key}
            onClick={() => setSelectedDay(day.key)}
            className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center space-x-2 ${
              selectedDay === day.key
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20 scale-[1.02]'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100 shadow-2xs'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{day.label}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedDay === day.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {day.date}
            </span>
          </button>
        ))}
      </div>

      {/* Confirmation Toast */}
      {orderedItem && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-900">
                Menü erfolgreich vorbestellt: <span className="underline">{orderedItem.title}</span>
              </p>
              <p className="text-[11px] text-emerald-700">
                Abholzeit: {pickupTime} Uhr • Abrechnung erfolgt über Mitarbeiterausweis ({orderedItem.price})
              </p>
            </div>
          </div>
          <button
            onClick={() => setOrderedItem(null)}
            className="text-xs font-bold text-emerald-800 hover:text-emerald-950 px-3 py-1 bg-emerald-200/50 rounded-xl"
          >
            Schließen
          </button>
        </div>
      )}

      {/* Dishes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(menuItems[selectedDay] || menuItems['HEUTE']).map((dish) => (
          <div
            key={dish.id}
            className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-card hover:shadow-xl transition-all duration-300 flex flex-col group"
          >
            {/* Dish Image Banner */}
            <div className="relative h-48 overflow-hidden">
              <img
                src={dish.image}
                alt={dish.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
              
              <div className="absolute top-3 left-3 flex items-center space-x-1.5">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/90 backdrop-blur-md text-slate-900 shadow-sm">
                  {dish.category}
                </span>
                {dish.isVeggie && (
                  <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-500 text-white flex items-center space-x-1 shadow-sm">
                    <Leaf className="w-3 h-3" />
                    <span>Veggie</span>
                  </span>
                )}
                {dish.isChefChoice && (
                  <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-amber-500 text-white flex items-center space-x-1 shadow-sm">
                    <Sparkles className="w-3 h-3" />
                    <span>Tipp</span>
                  </span>
                )}
              </div>

              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                <span className="text-xl font-extrabold">{dish.price}</span>
                <span className="text-[11px] text-slate-300 font-mono flex items-center space-x-1">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>{dish.calories}</span>
                </span>
              </div>
            </div>

            {/* Dish Body */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 group-hover:text-emerald-600 transition-colors leading-snug">
                  {dish.title}
                </h3>
                <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                  {dish.description}
                </p>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Allergene: {dish.allergens.join(', ')}</span>
                  <span>Gäste: {dish.guestPrice}</span>
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <select
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="11:45">11:45 Uhr</option>
                    <option value="12:15">12:15 Uhr</option>
                    <option value="12:30">12:30 Uhr</option>
                    <option value="13:00">13:00 Uhr</option>
                    <option value="13:30">13:30 Uhr</option>
                  </select>

                  <button
                    onClick={() => handleOrder(dish)}
                    className="flex-1 flex items-center justify-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Vorbestellen</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
