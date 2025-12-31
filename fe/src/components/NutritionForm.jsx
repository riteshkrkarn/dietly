import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Zod Schema for form validation
const nutrientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  value: z.number().min(0, "Value must be positive"),
  unit: z.string().min(1, "Unit is required"),
});

const nutritionFormSchema = z.object({
  productName: z.string().optional(),
  servingSize: z.string().optional(),
  nutrients: z.array(nutrientSchema).min(1, "At least one nutrient required"),
});

const NutritionForm = ({ nutrients, servingSize, productName, onSubmit }) => {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(nutritionFormSchema),
    defaultValues: {
      productName: productName || "Unknown",
      servingSize: servingSize || "",
      nutrients: nutrients || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "nutrients",
  });

  const handleFormSubmit = (data) => {
    onSubmit(data);
  };

  const addNutrient = () => {
    append({ name: "", value: 0, unit: "g" });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Product Info */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Product Name
          </label>
          <input
            {...register("productName")}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Serving Size
          </label>
          <input
            {...register("servingSize")}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Nutrients List */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-medium text-slate-500">
            Nutrients ({fields.length})
          </label>
          <button
            type="button"
            onClick={addNutrient}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            + Add Nutrient
          </button>
        </div>

        {errors.nutrients?.message && (
          <p className="text-xs text-red-500">{errors.nutrients.message}</p>
        )}

        <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg"
            >
              <div className="flex-1">
                <input
                  {...register(`nutrients.${index}.name`)}
                  placeholder="Name"
                  className={`w-full px-2 py-1.5 border rounded text-sm focus:ring-1 focus:ring-indigo-500 ${
                    errors.nutrients?.[index]?.name
                      ? "border-red-300"
                      : "border-slate-200"
                  }`}
                />
              </div>
              <div className="w-20">
                <input
                  {...register(`nutrients.${index}.value`, {
                    valueAsNumber: true,
                  })}
                  type="number"
                  step="0.1"
                  placeholder="Value"
                  className={`w-full px-2 py-1.5 border rounded text-sm text-right focus:ring-1 focus:ring-indigo-500 ${
                    errors.nutrients?.[index]?.value
                      ? "border-red-300"
                      : "border-slate-200"
                  }`}
                />
              </div>
              <select
                {...register(`nutrients.${index}.unit`)}
                className="w-16 px-1 py-1.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-indigo-500"
              >
                <option value="g">g</option>
                <option value="mg">mg</option>
                <option value="kcal">kcal</option>
                <option value="%">%</option>
                <option value="mcg">mcg</option>
                <option value="IU">IU</option>
              </select>
              <button
                type="button"
                onClick={() => remove(index)}
                className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-green-500/30 transition-all"
      >
        ✓ Confirm & Continue
      </button>
    </form>
  );
};

export default NutritionForm;
