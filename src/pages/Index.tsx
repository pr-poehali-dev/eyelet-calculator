import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CalculationResult {
  count: number;
  spacing: number;
  positions: number[];
  perimeter: number;
}

const Index = () => {
  const [width, setWidth] = useState<string>('1000');
  const [height, setHeight] = useState<string>('2000');
  const [minSpacing] = useState<number>(30);
  const [maxSpacing] = useState<number>(35);
  const [result, setResult] = useState<CalculationResult | null>(null);

  const calculateGrommets = () => {
    const w = parseFloat(width);
    const h = parseFloat(height);

    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
      return;
    }

    const perimeter = 2 * (w + h);
    const targetSpacing = (minSpacing + maxSpacing) / 2;
    let count = Math.round(perimeter / targetSpacing);
    
    if (count < 4) count = 4;
    
    const actualSpacing = perimeter / count;
    
    const positions: number[] = [];
    for (let i = 0; i < count; i++) {
      positions.push(i * actualSpacing);
    }

    setResult({
      count,
      spacing: Math.round(actualSpacing * 10) / 10,
      positions,
      perimeter: Math.round(perimeter),
    });
  };

  const getPositionOnPerimeter = (distance: number) => {
    const w = parseFloat(width);
    const h = parseFloat(height);
    
    if (distance <= w) {
      return { x: distance, y: 0, side: 'top' };
    } else if (distance <= w + h) {
      return { x: w, y: distance - w, side: 'right' };
    } else if (distance <= 2 * w + h) {
      return { x: w - (distance - w - h), y: h, side: 'bottom' };
    } else {
      return { x: 0, y: h - (distance - 2 * w - h), side: 'left' };
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center justify-center gap-3">
            <Icon name="Circle" size={32} className="text-primary" />
            Калькулятор люверсов
          </h1>
          <p className="text-muted-foreground text-lg">
            Профессиональный расчет разметки для установки люверсов
          </p>
        </div>

        <Tabs defaultValue="calculator" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="calculator">
              <Icon name="Calculator" size={18} className="mr-2" />
              Калькулятор
            </TabsTrigger>
            <TabsTrigger value="instructions">
              <Icon name="BookOpen" size={18} className="mr-2" />
              Инструкция
            </TabsTrigger>
            <TabsTrigger value="examples">
              <Icon name="FileText" size={18} className="mr-2" />
              Примеры
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calculator" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Settings" size={20} />
                    Параметры изделия
                  </CardTitle>
                  <CardDescription>
                    Введите размеры в миллиметрах
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="width">Ширина (мм)</Label>
                    <Input
                      id="width"
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      placeholder="1000"
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">Высота (мм)</Label>
                    <Input
                      id="height"
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="2000"
                      className="font-mono"
                    />
                  </div>
                  <Alert>
                    <Icon name="Info" size={16} />
                    <AlertDescription>
                      Шаг установки: {minSpacing}-{maxSpacing} мм
                    </AlertDescription>
                  </Alert>
                  <button
                    onClick={calculateGrommets}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
                  >
                    <Icon name="Play" size={18} />
                    Рассчитать
                  </button>
                </CardContent>
              </Card>

              {result && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon name="Check" size={20} className="text-primary" />
                      Результаты расчета
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-muted p-4 rounded-md">
                        <div className="text-sm text-muted-foreground mb-1">Количество</div>
                        <div className="text-3xl font-bold text-foreground">{result.count}</div>
                        <div className="text-xs text-muted-foreground mt-1">люверсов</div>
                      </div>
                      <div className="bg-muted p-4 rounded-md">
                        <div className="text-sm text-muted-foreground mb-1">Шаг</div>
                        <div className="text-3xl font-bold text-foreground">{result.spacing}</div>
                        <div className="text-xs text-muted-foreground mt-1">мм</div>
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <div className="text-sm font-medium mb-2">Периметр изделия</div>
                      <div className="text-xl font-semibold text-primary">{result.perimeter} мм</div>
                    </div>
                    <Separator />
                    <div>
                      <div className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Icon name="MapPin" size={16} />
                        Первые 4 позиции для разметки
                      </div>
                      <div className="space-y-2">
                        {result.positions.slice(0, 4).map((pos, idx) => {
                          const location = getPositionOnPerimeter(pos);
                          return (
                            <div key={idx} className="bg-muted/50 p-2 rounded text-sm font-mono flex justify-between">
                              <span>№{idx + 1}:</span>
                              <span className="font-bold">
                                {location.side === 'top' && `⭢ ${Math.round(location.x)} мм от левого края`}
                                {location.side === 'right' && `⭣ ${Math.round(location.y)} мм от верхнего края`}
                                {location.side === 'bottom' && `⭠ ${Math.round(parseFloat(width) - location.x)} мм от правого края`}
                                {location.side === 'left' && `⭡ ${Math.round(parseFloat(height) - location.y)} мм от нижнего края`}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {result && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Layout" size={20} />
                    Схема размещения люверсов
                  </CardTitle>
                  <CardDescription>
                    Визуализация расположения люверсов по периметру изделия
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="w-full overflow-x-auto">
                    <svg
                      viewBox={`-50 -50 ${parseFloat(width) + 100} ${parseFloat(height) + 100}`}
                      className="w-full h-auto border-2 border-border bg-card rounded-md"
                      style={{ maxHeight: '600px' }}
                    >
                      <rect
                        x="0"
                        y="0"
                        width={parseFloat(width)}
                        height={parseFloat(height)}
                        fill="none"
                        stroke="hsl(var(--foreground))"
                        strokeWidth="2"
                        strokeDasharray="10,5"
                      />
                      
                      {result.positions.map((pos, idx) => {
                        const location = getPositionOnPerimeter(pos);
                        return (
                          <g key={idx}>
                            <circle
                              cx={location.x}
                              cy={location.y}
                              r="8"
                              fill="hsl(var(--primary))"
                              stroke="hsl(var(--primary-foreground))"
                              strokeWidth="2"
                            />
                            <text
                              x={location.x}
                              y={location.y}
                              fill="hsl(var(--primary-foreground))"
                              fontSize="10"
                              fontWeight="bold"
                              textAnchor="middle"
                              dominantBaseline="central"
                            >
                              {idx + 1}
                            </text>
                          </g>
                        );
                      })}
                      
                      <text
                        x={parseFloat(width) / 2}
                        y="-20"
                        fill="hsl(var(--muted-foreground))"
                        fontSize="14"
                        textAnchor="middle"
                        fontWeight="500"
                      >
                        {width} мм
                      </text>
                      <text
                        x="-20"
                        y={parseFloat(height) / 2}
                        fill="hsl(var(--muted-foreground))"
                        fontSize="14"
                        textAnchor="middle"
                        fontWeight="500"
                        transform={`rotate(-90, -20, ${parseFloat(height) / 2})`}
                      >
                        {height} мм
                      </text>
                    </svg>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="instructions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="BookOpen" size={24} />
                  Инструкция по использованию
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Icon name="Target" size={20} className="text-primary" />
                    Назначение калькулятора
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Калькулятор предназначен для точного расчета количества и расположения люверсов на изделиях прямоугольной формы (баннеры, тенты, навесы). 
                    Программа автоматически рассчитывает оптимальный шаг установки в диапазоне 30-35 мм для обеспечения равномерного распределения нагрузки.
                  </p>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Icon name="ListOrdered" size={20} className="text-primary" />
                    Порядок работы
                  </h3>
                  <ol className="space-y-3 text-muted-foreground">
                    <li className="flex gap-3">
                      <span className="font-bold text-primary min-w-[24px]">1.</span>
                      <span>Введите ширину изделия в миллиметрах</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-bold text-primary min-w-[24px]">2.</span>
                      <span>Введите высоту изделия в миллиметрах</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-bold text-primary min-w-[24px]">3.</span>
                      <span>Нажмите кнопку "Рассчитать"</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-bold text-primary min-w-[24px]">4.</span>
                      <span>Изучите результаты расчета и используйте координаты для разметки</span>
                    </li>
                  </ol>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Icon name="Lightbulb" size={20} className="text-primary" />
                    Рекомендации по разметке
                  </h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex gap-2">
                      <Icon name="CheckCircle2" size={16} className="text-primary mt-1 flex-shrink-0" />
                      <span>Начинайте разметку с углов изделия</span>
                    </li>
                    <li className="flex gap-2">
                      <Icon name="CheckCircle2" size={16} className="text-primary mt-1 flex-shrink-0" />
                      <span>Используйте рулетку и маркер для точной разметки</span>
                    </li>
                    <li className="flex gap-2">
                      <Icon name="CheckCircle2" size={16} className="text-primary mt-1 flex-shrink-0" />
                      <span>Отступ от края должен составлять 15-20 мм</span>
                    </li>
                    <li className="flex gap-2">
                      <Icon name="CheckCircle2" size={16} className="text-primary mt-1 flex-shrink-0" />
                      <span>Проверьте разметку перед установкой люверсов</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="examples">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Flag" size={20} className="text-primary" />
                    Пример 1: Стандартный баннер
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-muted p-3 rounded-md">
                    <div className="text-sm text-muted-foreground">Размеры</div>
                    <div className="font-semibold">3000 × 2000 мм</div>
                  </div>
                  <div className="bg-muted p-3 rounded-md">
                    <div className="text-sm text-muted-foreground">Периметр</div>
                    <div className="font-semibold">10000 мм</div>
                  </div>
                  <div className="bg-primary/10 p-3 rounded-md border-l-4 border-primary">
                    <div className="text-sm text-muted-foreground">Результат</div>
                    <div className="font-bold text-lg">303 люверса</div>
                    <div className="text-sm text-muted-foreground mt-1">Шаг: 33.0 мм</div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Оптимальное решение для стандартного рекламного баннера с равномерным распределением нагрузки.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Tent" size={20} className="text-primary" />
                    Пример 2: Тент для грузовика
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-muted p-3 rounded-md">
                    <div className="text-sm text-muted-foreground">Размеры</div>
                    <div className="font-semibold">5000 × 2500 мм</div>
                  </div>
                  <div className="bg-muted p-3 rounded-md">
                    <div className="text-sm text-muted-foreground">Периметр</div>
                    <div className="font-semibold">15000 мм</div>
                  </div>
                  <div className="bg-primary/10 p-3 rounded-md border-l-4 border-primary">
                    <div className="text-sm text-muted-foreground">Результат</div>
                    <div className="font-bold text-lg">455 люверсов</div>
                    <div className="text-sm text-muted-foreground mt-1">Шаг: 33.0 мм</div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Усиленная конструкция для промышленного применения с повышенными нагрузками.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Square" size={20} className="text-primary" />
                    Пример 3: Малоформатное изделие
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-muted p-3 rounded-md">
                    <div className="text-sm text-muted-foreground">Размеры</div>
                    <div className="font-semibold">500 × 700 мм</div>
                  </div>
                  <div className="bg-muted p-3 rounded-md">
                    <div className="text-sm text-muted-foreground">Периметр</div>
                    <div className="font-semibold">2400 мм</div>
                  </div>
                  <div className="bg-primary/10 p-3 rounded-md border-l-4 border-primary">
                    <div className="text-sm text-muted-foreground">Результат</div>
                    <div className="font-bold text-lg">73 люверса</div>
                    <div className="text-sm text-muted-foreground mt-1">Шаг: 32.9 мм</div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Компактное изделие для внутреннего использования или точечной рекламы.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Maximize" size={20} className="text-primary" />
                    Пример 4: Крупногабаритный навес
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-muted p-3 rounded-md">
                    <div className="text-sm text-muted-foreground">Размеры</div>
                    <div className="font-semibold">8000 × 6000 мм</div>
                  </div>
                  <div className="bg-muted p-3 rounded-md">
                    <div className="text-sm text-muted-foreground">Периметр</div>
                    <div className="font-semibold">28000 мм</div>
                  </div>
                  <div className="bg-primary/10 p-3 rounded-md border-l-4 border-primary">
                    <div className="text-sm text-muted-foreground">Результат</div>
                    <div className="font-bold text-lg">848 люверсов</div>
                    <div className="text-sm text-muted-foreground mt-1">Шаг: 33.0 мм</div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Промышленное решение для крупных навесов и укрытий с максимальной надежностью крепления.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
