import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

interface CalculationResult {
  count: number;
  spacing: number;
  positions: number[];
  perimeter: number;
}

const Index = () => {
  const [width, setWidth] = useState<string>('1000');
  const [height, setHeight] = useState<string>('2000');
  const [minSpacing] = useState<number>(300);
  const [maxSpacing] = useState<number>(350);
  const [grommetsType, setGrommetsType] = useState<string>('16');
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
    
    let actualSpacing = perimeter / count;
    
    while (actualSpacing < minSpacing && count > 4) {
      count--;
      actualSpacing = perimeter / count;
    }
    
    while (actualSpacing > maxSpacing) {
      count++;
      actualSpacing = perimeter / count;
    }
    
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

  const exportToPDF = () => {
    if (!result) return;

    const doc = new jsPDF();
    const w = parseFloat(width);
    const h = parseFloat(height);

    doc.setFontSize(20);
    doc.text('Расчет люверсов', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Размеры изделия: ${width} × ${height} мм`, 20, 35);
    doc.text(`Тип люверса: ${grommetsType === '16' ? 'Ø 16 мм' : '42×22 мм'}`, 20, 42);
    doc.text(`Периметр: ${result.perimeter} мм`, 20, 49);
    doc.text(`Количество люверсов: ${result.count} шт`, 20, 56);
    doc.text(`Шаг установки: ${result.spacing} мм`, 20, 63);

    doc.setFontSize(14);
    doc.text('Координаты для разметки:', 20, 75);

    doc.setFontSize(9);
    let yPos = 85;
    result.positions.forEach((pos, idx) => {
      const location = getPositionOnPerimeter(pos);
      const nextPos = result.positions[(idx + 1) % result.positions.length];
      let distanceToNext = nextPos - pos;
      if (distanceToNext < 0) distanceToNext += result.perimeter;
      
      let text = `№${idx + 1}: `;
      
      if (location.side === 'top') {
        text += `Верх - ${Math.round(location.x)} мм от левого края`;
      } else if (location.side === 'right') {
        text += `Право - ${Math.round(location.y)} мм от верхнего края`;
      } else if (location.side === 'bottom') {
        text += `Низ - ${Math.round(w - location.x)} мм от правого края`;
      } else {
        text += `Лево - ${Math.round(h - location.y)} мм от нижнего края`;
      }
      
      text += ` | До №${((idx + 1) % result.positions.length) + 1}: ${Math.round(distanceToNext)} мм`;
      
      doc.text(text, 20, yPos);
      yPos += 5;
      
      if (yPos > 280 && idx < result.positions.length - 1) {
        doc.addPage();
        yPos = 20;
      }
    });

    doc.save(`lyversy_${width}x${height}.pdf`);
    toast.success('PDF чертеж успешно сохранен');
  };

  const exportToExcel = () => {
    if (!result) return;

    const w = parseFloat(width);
    const h = parseFloat(height);

    const data = result.positions.map((pos, idx) => {
      const location = getPositionOnPerimeter(pos);
      let side = '';
      let distance = 0;
      let reference = '';
      
      if (location.side === 'top') {
        side = 'Верхняя';
        distance = Math.round(location.x);
        reference = 'от левого края';
      } else if (location.side === 'right') {
        side = 'Правая';
        distance = Math.round(location.y);
        reference = 'от верхнего края';
      } else if (location.side === 'bottom') {
        side = 'Нижняя';
        distance = Math.round(w - location.x);
        reference = 'от правого края';
      } else {
        side = 'Левая';
        distance = Math.round(h - location.y);
        reference = 'от нижнего края';
      }
      
      const nextPos = result.positions[(idx + 1) % result.positions.length];
      let distanceToNext = nextPos - pos;
      if (distanceToNext < 0) distanceToNext += result.perimeter;
      
      return {
        '№': idx + 1,
        'Сторона': side,
        'Расстояние от края (мм)': distance,
        'Отсчет': reference,
        'До следующего (мм)': Math.round(distanceToNext),
        'X (мм)': Math.round(location.x),
        'Y (мм)': Math.round(location.y)
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Разметка');

    const summaryData = [
      { 'Параметр': 'Ширина изделия', 'Значение': `${width} мм` },
      { 'Параметр': 'Высота изделия', 'Значение': `${height} мм` },
      { 'Параметр': 'Тип люверса', 'Значение': grommetsType === '16' ? 'Ø 16 мм' : '42×22 мм' },
      { 'Параметр': 'Периметр', 'Значение': `${result.perimeter} мм` },
      { 'Параметр': 'Количество люверсов', 'Значение': `${result.count} шт` },
      { 'Параметр': 'Шаг установки', 'Значение': `${result.spacing} мм` },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Параметры');

    XLSX.writeFile(wb, `lyversy_${width}x${height}.xlsx`);
    toast.success('Excel файл успешно сохранен');
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
                  <div className="space-y-2">
                    <Label htmlFor="grommetType">Тип люверса</Label>
                    <select
                      id="grommetType"
                      value={grommetsType}
                      onChange={(e) => setGrommetsType(e.target.value)}
                      className="w-full p-2 border border-input bg-background rounded-md"
                    >
                      <option value="16">Ø 16 мм</option>
                      <option value="42x22">42×22 мм</option>
                    </select>
                  </div>
                  <Alert>
                    <Icon name="Info" size={16} />
                    <AlertDescription>
                      Шаг установки: {minSpacing}-{maxSpacing} мм
                    </AlertDescription>
                  </Alert>
                  <Button
                    onClick={calculateGrommets}
                    className="w-full font-medium py-6 text-base"
                    size="lg"
                  >
                    <Icon name="Play" size={18} />
                    Рассчитать
                  </Button>
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
                        {result.positions.map((pos, idx) => {
                          const location = getPositionOnPerimeter(pos);
                          const nextPos = result.positions[(idx + 1) % result.positions.length];
                          let distanceToNext = nextPos - pos;
                          if (distanceToNext < 0) distanceToNext += result.perimeter;
                          
                          return (
                            <div key={idx} className="bg-muted/50 p-3 rounded text-sm space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-primary">№{idx + 1}</span>
                                <span className="text-xs text-muted-foreground">→ {Math.round(distanceToNext)} мм до №{((idx + 1) % result.positions.length) + 1}</span>
                              </div>
                              <div className="font-mono text-xs">
                                {location.side === 'top' && `⭢ Верх: ${Math.round(location.x)} мм от левого края`}
                                {location.side === 'right' && `⭣ Право: ${Math.round(location.y)} мм от верхнего края`}
                                {location.side === 'bottom' && `⭠ Низ: ${Math.round(parseFloat(width) - location.x)} мм от правого края`}
                                {location.side === 'left' && `⭡ Лево: ${Math.round(parseFloat(height) - location.y)} мм от нижнего края`}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <Separator />
                    <div className="flex gap-3">
                      <Button
                        onClick={exportToPDF}
                        variant="outline"
                        className="flex-1"
                      >
                        <Icon name="FileDown" size={18} className="mr-2" />
                        Скачать PDF
                      </Button>
                      <Button
                        onClick={exportToExcel}
                        variant="outline"
                        className="flex-1"
                      >
                        <Icon name="Table" size={18} className="mr-2" />
                        Экспорт в Excel
                      </Button>
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
                    Предварительный чертеж
                  </CardTitle>
                  <CardDescription>
                    Визуализация расположения люверсов с нумерацией и размерами
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="w-full overflow-x-auto">
                    <svg
                      viewBox={`-100 -100 ${parseFloat(width) + 200} ${parseFloat(height) + 200}`}
                      className="w-full h-auto border-2 border-border bg-card rounded-md"
                      style={{ maxHeight: '700px' }}
                    >
                      <defs>
                        <marker
                          id="arrowhead"
                          markerWidth="10"
                          markerHeight="10"
                          refX="9"
                          refY="3"
                          orient="auto"
                        >
                          <polygon
                            points="0 0, 10 3, 0 6"
                            fill="hsl(var(--muted-foreground))"
                          />
                        </marker>
                      </defs>
                      
                      <rect
                        x="-15"
                        y="-15"
                        width={parseFloat(width) + 30}
                        height={parseFloat(height) + 30}
                        fill="hsl(var(--muted))"
                        stroke="hsl(var(--foreground))"
                        strokeWidth="15"
                        rx="5"
                      />
                      
                      <rect
                        x="0"
                        y="0"
                        width={parseFloat(width)}
                        height={parseFloat(height)}
                        fill="hsl(var(--background))"
                        stroke="none"
                      />
                      
                      <line
                        x1="-80"
                        y1="0"
                        x2="-80"
                        y2={parseFloat(height)}
                        stroke="hsl(var(--muted-foreground))"
                        strokeWidth="1.5"
                        markerEnd="url(#arrowhead)"
                        markerStart="url(#arrowhead)"
                      />
                      <text
                        x="-85"
                        y={parseFloat(height) / 2}
                        fill="hsl(var(--foreground))"
                        fontSize="16"
                        fontWeight="bold"
                        textAnchor="end"
                        dominantBaseline="middle"
                      >
                        {height} мм
                      </text>
                      
                      <line
                        x1="0"
                        y1={parseFloat(height) + 80}
                        x2={parseFloat(width)}
                        y2={parseFloat(height) + 80}
                        stroke="hsl(var(--muted-foreground))"
                        strokeWidth="1.5"
                        markerEnd="url(#arrowhead)"
                        markerStart="url(#arrowhead)"
                      />
                      <text
                        x={parseFloat(width) / 2}
                        y={parseFloat(height) + 95}
                        fill="hsl(var(--foreground))"
                        fontSize="16"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {width} мм
                      </text>
                      
                      {result.positions.map((pos, idx) => {
                        const location = getPositionOnPerimeter(pos);
                        const labelOffset = 25;
                        let labelX = location.x;
                        let labelY = location.y;
                        
                        if (location.side === 'top') {
                          labelY = location.y - labelOffset;
                        } else if (location.side === 'bottom') {
                          labelY = location.y + labelOffset;
                        } else if (location.side === 'left') {
                          labelX = location.x - labelOffset;
                        } else if (location.side === 'right') {
                          labelX = location.x + labelOffset;
                        }
                        
                        return (
                          <g key={idx}>
                            <line
                              x1={location.x}
                              y1={location.y}
                              x2={labelX}
                              y2={labelY}
                              stroke="hsl(var(--muted-foreground))"
                              strokeWidth="1"
                              strokeDasharray="2,2"
                            />
                            
                            {grommetsType === '16' ? (
                              <circle
                                cx={location.x}
                                cy={location.y}
                                r="8"
                                fill="hsl(var(--primary))"
                                stroke="hsl(var(--background))"
                                strokeWidth="3"
                              />
                            ) : (
                              <ellipse
                                cx={location.x}
                                cy={location.y}
                                rx="12"
                                ry="7"
                                fill="hsl(var(--primary))"
                                stroke="hsl(var(--background))"
                                strokeWidth="3"
                                transform={`rotate(${location.side === 'top' || location.side === 'bottom' ? 0 : 90}, ${location.x}, ${location.y})`}
                              />
                            )}
                            
                            <circle
                              cx={labelX}
                              cy={labelY}
                              r="14"
                              fill="hsl(var(--primary))"
                              stroke="hsl(var(--foreground))"
                              strokeWidth="1.5"
                            />
                            <text
                              x={labelX}
                              y={labelY}
                              fill="hsl(var(--primary-foreground))"
                              fontSize="11"
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