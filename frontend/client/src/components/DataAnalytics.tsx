import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { TrendingUp, Trees, Leaf, DollarSign, MapPin } from 'lucide-react';

export function DataAnalytics() {
  const { t } = useTranslation();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-foreground mb-6">{t('data_analytics')}</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* NDVI Indices Report */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-primary" />
              {t('indices_report')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* NDVI Chart Mock */}
              <div className="h-48 ndvi-chart rounded-lg p-4 relative">
                <div className="absolute top-4 left-4">
                  <h4 className="font-medium text-primary">NDVI Trend Analysis</h4>
                  <p className="text-sm text-muted-foreground">Last 30 days</p>
                </div>
                {/* Mock chart line */}
                <svg className="absolute bottom-4 left-4 right-4" height="80" width="100%">
                  <polyline 
                    points="0,60 50,45 100,35 150,40 200,25 250,30 300,20" 
                    fill="none" 
                    stroke="rgb(34, 197, 94)" 
                    strokeWidth="3"
                  />
                  <circle cx="300" cy="20" r="4" fill="rgb(34, 197, 94)" />
                </svg>
                <div className="absolute bottom-4 right-4 text-sm font-medium text-primary">
                  Current: 0.75
                </div>
              </div>
              {/* AWD Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-primary/10 rounded-lg">
                  <h4 className="font-medium text-primary mb-2">{t('water_status')}</h4>
                  <p className="text-2xl font-bold text-primary">Optimal</p>
                  <p className="text-sm text-muted-foreground">NDWI: 0.45</p>
                </div>
                <div className="p-4 bg-accent/10 rounded-lg">
                  <h4 className="font-medium text-accent mb-2">{t('stress_level')}</h4>
                  <p className="text-2xl font-bold text-accent">Low</p>
                  <p className="text-sm text-muted-foreground">15% affected area</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tree Count Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trees className="mr-2 h-5 w-5 text-primary" />
              {t('tree_count')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto flex items-center justify-center">
                <Trees className="text-3xl text-primary h-8 w-8" />
              </div>
              <div>
                <div className="text-3xl font-bold text-primary" data-testid="text-tree-count">127</div>
                <div className="text-sm text-muted-foreground">{t('trees_detected')}</div>
              </div>
              <div className="text-xs text-muted-foreground">{t('last_scan')}</div>
            </div>
          </CardContent>
        </Card>

        {/* Carbon Credits Estimation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Leaf className="mr-2 h-5 w-5 text-primary" />
              {t('carbon_credits')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary" data-testid="text-carbon-credits">2.4</div>
                <div className="text-sm text-muted-foreground">{t('credits_earned')}</div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{t('methane_reduction')}</span>
                  <span className="font-medium">1.8 tCO₂e</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{t('water_saving')}</span>
                  <span className="font-medium">0.6 tCO₂e</span>
                </div>
              </div>
              <div className="p-3 bg-accent/10 rounded-lg text-center">
                <p className="text-sm text-accent font-medium">{t('estimated_value')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Market Price Widget */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="mr-2 h-5 w-5 text-primary" />
              {t('market_price')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg">
                <div>
                  <p className="font-medium text-secondary">Wheat</p>
                  <p className="text-sm text-muted-foreground">Per quintal</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-secondary" data-testid="text-wheat-price">₹1,850</p>
                  <p className="text-xs text-green-600">+2.5% ↗</p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">{t('best_mandi')}</p>
                <p className="text-xs text-muted-foreground">{t('distance')}</p>
              </div>
              <Button className="w-full bg-primary hover:bg-primary/90" data-testid="button-view-directions">
                <MapPin className="mr-2 h-4 w-4" />
                {t('view_directions')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
