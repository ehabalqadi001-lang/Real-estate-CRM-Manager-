'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Heart,
  MapPin,
  Bed,
  Bath,
  Square,
  Phone,
  MessageCircle,
  Eye,
  Star
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

// Mock data - will be replaced with real data from Supabase
const mockProperties = [
  {
    id: '1',
    title: 'شقة فاخرة في التجمع الخامس',
    price: 2500000,
    location: 'التجمع الخامس، القاهرة الجديدة',
    bedrooms: 3,
    bathrooms: 2,
    area: 150,
    images: ['/api/placeholder/400/300'],
    type: 'apartment',
    featured: true,
    seller: {
      name: 'أحمد محمد',
      avatar: '',
      rating: 4.8,
      verified: true
    },
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    title: 'فيلا مستقلة في الشروق',
    price: 4500000,
    location: 'مدينة الشروق، القاهرة',
    bedrooms: 4,
    bathrooms: 3,
    area: 300,
    images: ['/api/placeholder/400/300'],
    type: 'villa',
    featured: false,
    seller: {
      name: 'فاطمة أحمد',
      avatar: '',
      rating: 4.9,
      verified: true
    },
    createdAt: '2024-01-14'
  },
  // Add more mock properties...
]

interface Property {
  id: string
  title: string
  price: number
  location: string
  bedrooms: number
  bathrooms: number
  area: number
  images: string[]
  type: string
  featured: boolean
  seller: {
    name: string
    avatar: string
    rating: number
    verified: boolean
  }
  createdAt: string
}

export default function PropertyGrid() {
  const { user } = useAuthStore()
  const [properties] = useState<Property[]>(mockProperties)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  // TODO: Replace with real Supabase query
  useEffect(() => {
    // fetchProperties()
  }, [])

  const toggleFavorite = (propertyId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(propertyId)) {
        newFavorites.delete(propertyId)
      } else {
        newFavorites.add(propertyId)
      }
      return newFavorites
    })
  }

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M ج.م`
    }
    return `${(price / 1000).toFixed(0)}K ج.م`
  }

  const getPropertyTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      apartment: 'شقة',
      villa: 'فيلا',
      townhouse: 'تاون هاوس',
      penthouse: 'بنتهاوس',
      studio: 'استوديو',
      duplex: 'دوبلكس',
      office: 'مكتب',
      shop: 'محل',
      warehouse: 'مستودع'
    }
    return types[type] || type
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {properties.map((property) => (
        <Card key={property.id} className="group hover:shadow-lg transition-all duration-300 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="relative">
            {/* Property Image */}
            <div className="aspect-[4/3] overflow-hidden">
              <Image
                src={property.images[0]}
                alt={property.title}
                width={400}
                height={300}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            {/* Badges */}
            <div className="absolute top-3 right-3 flex flex-col gap-2">
              {property.featured && (
                <Badge className="bg-gold text-navy font-semibold">
                  مميز
                </Badge>
              )}
              <Badge variant="secondary" className="bg-white/90 text-slate-700">
                {getPropertyTypeLabel(property.type)}
              </Badge>
            </div>

            {/* Favorite Button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-3 left-3 h-8 w-8 rounded-full bg-white/80 hover:bg-white text-slate-600 hover:text-red-500"
              onClick={() => toggleFavorite(property.id)}
            >
              <Heart
                className={`h-4 w-4 ${favorites.has(property.id) ? 'fill-red-500 text-red-500' : ''}`}
              />
            </Button>
          </div>

          <CardContent className="p-4">
            {/* Price */}
            <div className="mb-3">
              <span className="text-2xl font-bold text-navy dark:text-white">
                {formatPrice(property.price)}
              </span>
            </div>

            {/* Title */}
            <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-2 line-clamp-2">
              {property.title}
            </h3>

            {/* Location */}
            <div className="flex items-center text-slate-600 dark:text-slate-300 mb-3">
              <MapPin className="h-4 w-4 ml-1 flex-shrink-0" />
              <span className="text-sm line-clamp-1">{property.location}</span>
            </div>

            {/* Property Details */}
            <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300 mb-4">
              <div className="flex items-center">
                <Bed className="h-4 w-4 ml-1" />
                <span>{property.bedrooms}</span>
              </div>
              <div className="flex items-center">
                <Bath className="h-4 w-4 ml-1" />
                <span>{property.bathrooms}</span>
              </div>
              <div className="flex items-center">
                <Square className="h-4 w-4 ml-1" />
                <span>{property.area} م²</span>
              </div>
            </div>

            {/* Seller Info */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={property.seller.avatar} alt={property.seller.name} />
                  <AvatarFallback>
                    {property.seller.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {property.seller.name}
                  </p>
                  <div className="flex items-center">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 ml-1" />
                    <span className="text-xs text-slate-600 dark:text-slate-300">
                      {property.seller.rating}
                    </span>
                    {property.seller.verified && (
                      <Badge variant="secondary" className="text-xs ml-2 bg-green-100 text-green-800">
                        موثق
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-slate-300 hover:border-navy hover:text-navy"
              >
                <Eye className="h-4 w-4 ml-2" />
                عرض التفاصيل
              </Button>

              {user ? (
                <Button
                  size="sm"
                  className="flex-1 bg-navy hover:bg-navy-light text-white"
                >
                  <MessageCircle className="h-4 w-4 ml-2" />
                  تواصل
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-slate-300 text-slate-600"
                  disabled
                >
                  <Phone className="h-4 w-4 ml-2" />
                  تسجيل للتواصل
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
