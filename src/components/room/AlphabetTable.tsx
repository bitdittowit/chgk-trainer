import { Button } from "@/components/ui/button";

const RUSSIAN_ALPHABET = [
  "А","Б","В","Г","Д","Е","Ж","З","И","К","Л","М","Н","О","П","Р","С","Т","У","Ф","Х","Ц","Ч","Ш","Щ","Э","Ю","Я"
];

export function AlphabetTable({ crossed, onClick } : {
  crossed: string[];
  onClick: (letter: string) => void;
}) {
  return (
    <div className="grid grid-cols-8 gap-2">
      {RUSSIAN_ALPHABET.map((letter) => (
        <Button
          key={letter}
          variant={crossed.includes(letter) ? "outline" : "default"}
          className={crossed.includes(letter) ? "line-through opacity-50" : ""}
          onClick={() => onClick(letter)}
          disabled={crossed.includes(letter)}
        >
          {letter}
        </Button>
      ))}
    </div>
  );
} 
