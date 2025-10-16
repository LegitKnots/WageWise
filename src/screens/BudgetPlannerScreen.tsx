import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Edit3, Trash2, DollarSign, PieChart } from 'lucide-react-native';
import { useWageTracker } from 'context/wageTracker';
import { useTheme } from 'context/ThemeContext';
import ErrorBoundary from 'components/ErrorBoundary';
import { 
  safeArray, 
  safeAsyncStorageGet} from 'utils/safeAccess';
import { COLORS, COLOR_OPTIONS } from 'constants/colors';

interface BudgetCategory {
  id: string;
  name: string;
  amount: number;
  spent: number;
  color: string;
}

interface BudgetGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  description?: string;
}

interface Expense {
  id: string;
  categoryId: string;
  amount: number;
  description: string;
  date: Date;
}

const BUDGET_STORAGE_KEY = '@app:budgetPlanner:v1';
const colorOptions = COLOR_OPTIONS;

const BudgetPlannerScreen = () => {
  const { colors } = useTheme();
  useWageTracker();

  // Safe access to stats
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
  const [budgetGoals, setBudgetGoals] = useState<BudgetGoal[]>([]);
  const [, setExpenses] = useState<Expense[]>([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showReports, setShowReports] = useState(false);
  
  // Form states
  const [categoryName, setCategoryName] = useState('');
  const [categoryAmount, setCategoryAmount] = useState('');
  const [categoryColor, setCategoryColor] = useState<string>(COLORS.primary);
  const [goalName, setGoalName] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('');
  const [goalDate, setGoalDate] = useState(new Date());
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await safeAsyncStorageGet(BUDGET_STORAGE_KEY, { categories: [], goals: [], expenses: [] });
      setBudgetCategories(safeArray(data.categories, []));
      setBudgetGoals(safeArray(data.goals, []));
      setExpenses(safeArray(data.expenses, []));
    } catch (error) {
      console.error('Error loading budget data:', error);
      // Set empty arrays as fallback
      setBudgetCategories([]);
      setBudgetGoals([]);
      setExpenses([]);
    }
  };


  const totalBudget = useMemo(() => 
    budgetCategories.reduce((sum, cat) => sum + cat.amount, 0), 
    [budgetCategories]
  );

  const totalSpent = useMemo(() => 
    budgetCategories.reduce((sum, cat) => sum + cat.spent, 0), 
    [budgetCategories]
  );

  const remainingBudget = totalBudget - totalSpent;
  const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const addCategory = () => {
    if (!categoryName.trim() || !categoryAmount) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    const newCategory: BudgetCategory = {
      id: Date.now().toString(),
      name: categoryName.trim(),
      amount: parseFloat(categoryAmount),
      spent: 0,
      color: categoryColor,
    };

    setBudgetCategories(prev => [...prev, newCategory]);
    setCategoryName('');
    setCategoryAmount('');
    setCategoryColor(COLORS.primary);
    setShowAddCategory(false);
  };

  const editCategory = () => {
    // TODO: Implement edit functionality
    Alert.alert('Edit Category', 'Edit functionality will be implemented in the next update.');
  };

  const deleteCategory = (id: string) => {
    Alert.alert(
      'Delete Category',
      'Are you sure you want to delete this budget category? All related expenses will be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          setBudgetCategories(prev => prev.filter(c => c.id !== id));
          setExpenses(prev => prev.filter(exp => exp.categoryId !== id));
        }}
      ]
    );
  };

  const addGoal = () => {
    if (!goalName.trim() || !goalAmount || !goalCurrent) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    const newGoal: BudgetGoal = {
      id: Date.now().toString(),
      name: goalName.trim(),
      targetAmount: parseFloat(goalAmount),
      currentAmount: parseFloat(goalCurrent),
      targetDate: goalDate,
      description: 'Savings goal',
    };

    setBudgetGoals(prev => [...prev, newGoal]);
    setGoalName('');
    setGoalAmount('');
    setGoalCurrent('');
    setGoalDate(new Date());
    setShowAddGoal(false);
  };

  const editGoal = () => {
    // TODO: Implement edit functionality
    Alert.alert('Edit Goal', 'Edit functionality will be implemented in the next update.');
  };

  const deleteGoal = (id: string) => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this budget goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          setBudgetGoals(prev => prev.filter(g => g.id !== id));
        }}
      ]
    );
  };

  const addExpense = () => {
    if (!expenseCategory || !expenseAmount || !expenseDescription.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    const newExpense: Expense = {
      id: Date.now().toString(),
      categoryId: expenseCategory,
      amount: parseFloat(expenseAmount),
      description: expenseDescription.trim(),
      date: new Date(),
    };

    setExpenses(prev => [...prev, newExpense]);
    
    // Update category spent amount
    setBudgetCategories(prev => prev.map(cat => 
      cat.id === expenseCategory 
        ? { ...cat, spent: cat.spent + parseFloat(expenseAmount) }
        : cat
    ));

    setExpenseCategory('');
    setExpenseAmount('');
    setExpenseDescription('');
    setShowAddExpense(false);
  };



  const formatCurrency = (amount: number) => 
    Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);

  const getGoalProgress = (goal: BudgetGoal) => {
    return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  };

  const getDaysUntilGoal = (goal: BudgetGoal) => {
    const now = new Date();
    const diffTime = goal.targetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(diffDays, 0);
  };

  return (
    <ErrorBoundary>
      <SafeAreaView style={[styles.container, { backgroundColor: colors?.background || '#FFFFFF' }]}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Budget Planner</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Plan and track your spending</Text>
        </View>

        {/* Monthly Overview */}
        <View style={[styles.overviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.overviewTitle, { color: colors.text }]}>This Month</Text>
          <View style={styles.overviewStats}>
            <View style={styles.overviewStat}>
              <Text style={[styles.overviewLabel, { color: colors.textMuted }]}>Total Budget</Text>
              <Text style={[styles.overviewValue, { color: colors.text }]}>{formatCurrency(totalBudget)}</Text>
            </View>
            <View style={styles.overviewStat}>
              <Text style={[styles.overviewLabel, { color: colors.textMuted }]}>Spent</Text>
              <Text style={[styles.overviewValue, { color: colors.text }]}>{formatCurrency(totalSpent)}</Text>
            </View>
            <View style={styles.overviewStat}>
              <Text style={[styles.overviewLabel, { color: colors.textMuted }]}>Remaining</Text>
              <Text style={[
                styles.overviewValue,
                { color: remainingBudget >= 0 ? colors.success : colors.error }
              ]}>
                {formatCurrency(remainingBudget)}
              </Text>
            </View>
          </View>
          
          {/* Budget Utilization Bar */}
          <View style={styles.utilizationContainer}>
            <View style={[styles.utilizationBar, { backgroundColor: colors.surface }]}>
              <View 
                style={[
                  styles.utilizationFill,
                  { 
                    width: `${Math.min(budgetUtilization, 100)}%`,
                    backgroundColor: budgetUtilization > 100 ? colors.error : 
                                   budgetUtilization > 80 ? colors.warning : colors.success
                  }
                ]} 
              />
            </View>
            <Text style={[styles.utilizationText, { color: colors.textMuted }]}>
              {budgetUtilization.toFixed(1)}% utilized
            </Text>
          </View>
        </View>

        {/* Budget Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Budget Categories</Text>
            <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={() => setShowAddCategory(true)}>
              <Plus size={16} color={COLORS.white} />
            </TouchableOpacity>
          </View>
          
          {budgetCategories.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No budget categories yet. Add one to get started!
              </Text>
            </View>
          ) : (
            budgetCategories.map((category) => (
              <View key={category.id} style={[styles.categoryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryInfo}>
                    <View style={[styles.categoryColor, { backgroundColor: category.color }]} />
                    <Text style={[styles.categoryName, { color: colors.text }]}>{category.name}</Text>
                  </View>
                  <View style={styles.categoryActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.surface }]}
                      onPress={() => editCategory()}
                    >
                      <Edit3 size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.surface }]}
                      onPress={() => deleteCategory(category.id)}
                    >
                      <Trash2 size={16} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.categoryProgress}>
                  <View style={styles.categoryAmounts}>
                    <Text style={[styles.categorySpent, { color: colors.text }]}>{formatCurrency(category.spent)}</Text>
                    <Text style={[styles.categoryTotal, { color: colors.textMuted }]}>of {formatCurrency(category.amount)}</Text>
                  </View>
                  <View style={[styles.categoryBar, { backgroundColor: colors.surface }]}>
                    <View 
                      style={[
                        styles.categoryBarFill,
                        { 
                          width: `${Math.min((category.spent / category.amount) * 100, 100)}%`,
                          backgroundColor: category.color
                        }
                      ]} 
                    />
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Budget Goals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Savings Goals</Text>
            <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={() => setShowAddGoal(true)}>
              <Plus size={16} color={COLORS.white} />
            </TouchableOpacity>
          </View>
          
          {budgetGoals.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No savings goals yet. Add one to start saving!
              </Text>
            </View>
          ) : (
            budgetGoals.map((goal) => {
              const progress = getGoalProgress(goal);
              const daysLeft = getDaysUntilGoal(goal);
              
              return (
                <View key={goal.id} style={[styles.goalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.goalHeader}>
                    <View style={styles.goalInfo}>
                      <Text style={[styles.goalName, { color: colors.text }]}>{goal.name}</Text>
                      <Text style={[styles.goalDescription, { color: colors.textMuted }]}>{goal.description}</Text>
                    </View>
                    <View style={styles.goalActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.surface }]}
                        onPress={() => editGoal()}
                      >
                        <Edit3 size={16} color={colors.textMuted} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.surface }]}
                        onPress={() => deleteGoal(goal.id)}
                      >
                        <Trash2 size={16} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={styles.goalProgress}>
                    <View style={styles.goalAmounts}>
                      <Text style={[styles.goalCurrent, { color: colors.text }]}>{formatCurrency(goal.currentAmount)}</Text>
                      <Text style={[styles.goalTarget, { color: colors.textMuted }]}>of {formatCurrency(goal.targetAmount)}</Text>
                      <Text style={[styles.goalPercentage, { color: colors.primary }]}>{progress.toFixed(1)}%</Text>
                    </View>
                    <View style={[styles.goalBar, { backgroundColor: colors.surface }]}>
                      <View 
                        style={[
                          styles.goalBarFill,
                          { 
                            width: `${progress}%`,
                            backgroundColor: colors.primary
                          }
                        ]} 
                      />
                    </View>
                    <Text style={[styles.goalDeadline, { color: colors.textMuted }]}>
                      {daysLeft > 0 ? `${daysLeft} days left` : 'Goal reached!'}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.quickActionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setShowAddExpense(true)}
          >
            <DollarSign size={20} color={colors.primary} />
            <Text style={[styles.quickActionText, { color: colors.primary }]}>Add Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.quickActionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setShowReports(true)}
          >
            <PieChart size={20} color={colors.primary} />
            <Text style={[styles.quickActionText, { color: colors.primary }]}>View Reports</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Add Category Modal */}
      <Modal visible={showAddCategory} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Budget Category</Text>
            
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Category Name</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text 
                }]}
                value={categoryName}
                onChangeText={setCategoryName}
                placeholder="e.g., Groceries, Rent, Entertainment"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Monthly Budget</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text 
                }]}
                value={categoryAmount}
                onChangeText={setCategoryAmount}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Color</Text>
              <View style={styles.colorOptions}>
                {colorOptions.map(color => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      categoryColor === color && styles.selectedColor
                    ]}
                    onPress={() => setCategoryColor(color)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: colors.border }]}
                onPress={() => setShowAddCategory(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={addCategory}
              >
                <Text style={styles.modalButtonText}>Add Category</Text>
              </TouchableOpacity>
            </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Add Goal Modal */}
      <Modal visible={showAddGoal} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Savings Goal</Text>
            
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Goal Name</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text 
                }]}
                value={goalName}
                onChangeText={setGoalName}
                placeholder="e.g., Emergency Fund, Vacation"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Target Amount</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text 
                }]}
                value={goalAmount}
                onChangeText={setGoalAmount}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Current Amount</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text 
                }]}
                value={goalCurrent}
                onChangeText={setGoalCurrent}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: colors.border }]}
                onPress={() => setShowAddGoal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={addGoal}
              >
                <Text style={styles.modalButtonText}>Add Goal</Text>
              </TouchableOpacity>
            </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Add Expense Modal */}
      <Modal visible={showAddExpense} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Expense</Text>
            
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.categoryOptions}>
                  {budgetCategories.map(category => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryOption,
                        { 
                          backgroundColor: expenseCategory === category.id ? colors.primary : colors.surface,
                          borderColor: colors.border 
                        }
                      ]}
                      onPress={() => setExpenseCategory(category.id)}
                    >
                      <Text style={[
                        styles.categoryOptionText,
                        { color: expenseCategory === category.id ? COLORS.white : colors.text }
                      ]}>
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Amount</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text 
                }]}
                value={expenseAmount}
                onChangeText={setExpenseAmount}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Description</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text 
                }]}
                value={expenseDescription}
                onChangeText={setExpenseDescription}
                placeholder="What did you spend on?"
                placeholderTextColor={colors.textMuted}
                multiline
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: colors.border }]}
                onPress={() => setShowAddExpense(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={addExpense}
              >
                <Text style={styles.modalButtonText}>Add Expense</Text>
              </TouchableOpacity>
            </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Reports Modal */}
      <Modal visible={showReports} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Budget Reports</Text>
            
            <View style={styles.reportSection}>
              <Text style={[styles.reportTitle, { color: colors.text }]}>Monthly Summary</Text>
              <View style={styles.reportItem}>
                <Text style={[styles.reportLabel, { color: colors.textMuted }]}>Total Allocated:</Text>
                <Text style={[styles.reportValue, { color: colors.text }]}>${totalBudget.toFixed(2)}</Text>
              </View>
              <View style={styles.reportItem}>
                <Text style={[styles.reportLabel, { color: colors.textMuted }]}>Total Spent:</Text>
                <Text style={[styles.reportValue, { color: colors.text }]}>${totalSpent.toFixed(2)}</Text>
              </View>
              <View style={styles.reportItem}>
                <Text style={[styles.reportLabel, { color: colors.textMuted }]}>Remaining:</Text>
                <Text style={[styles.reportValue, { color: colors.text }]}>${remainingBudget.toFixed(2)}</Text>
              </View>
            </View>

            <View style={styles.reportSection}>
              <Text style={[styles.reportTitle, { color: colors.text }]}>Savings Progress</Text>
              <View style={styles.reportItem}>
                <Text style={[styles.reportLabel, { color: colors.textMuted }]}>Total Saved:</Text>
                <Text style={[styles.reportValue, { color: colors.text }]}>${budgetGoals.reduce((sum, goal) => sum + goal.currentAmount, 0).toFixed(2)}</Text>
              </View>
              <View style={styles.reportItem}>
                <Text style={[styles.reportLabel, { color: colors.textMuted }]}>Goal Targets:</Text>
                <Text style={[styles.reportValue, { color: colors.text }]}>${budgetGoals.reduce((sum, goal) => sum + goal.targetAmount, 0).toFixed(2)}</Text>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={() => setShowReports(false)}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 120, // Extra padding to push content up when keyboard appears
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  overviewCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  overviewStat: {
    alignItems: 'center',
  },
  overviewLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  overviewValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  utilizationContainer: {
    gap: 8,
  },
  utilizationBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  utilizationFill: {
    height: '100%',
    borderRadius: 4,
  },
  utilizationText: {
    fontSize: 12,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  addButton: {
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
  },
  categoryProgress: {
    gap: 8,
  },
  categoryAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categorySpent: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryTotal: {
    fontSize: 14,
  },
  categoryBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  goalCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  goalInfo: {
    flex: 1,
  },
  goalName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  goalDescription: {
    fontSize: 14,
  },
  goalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  goalProgress: {
    gap: 8,
  },
  goalAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalCurrent: {
    fontSize: 14,
    fontWeight: '600',
  },
  goalTarget: {
    fontSize: 14,
  },
  goalPercentage: {
    fontSize: 14,
    fontWeight: '600',
  },
  goalBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  goalBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  goalDeadline: {
    fontSize: 12,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  colorOptions: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#000',
  },
  categoryOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryOptionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  reportSection: {
    marginBottom: 20,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  reportItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  reportLabel: {
    fontSize: 14,
  },
  reportValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default BudgetPlannerScreen;
