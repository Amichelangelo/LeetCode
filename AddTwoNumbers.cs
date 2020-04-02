using System;
using System.Collections.Generic;
using System.Text;

namespace LeetCode
{
    static class AddTwoNumbers
    {
        public static List<int> AddList(List<int> l1, List<int> l2)
        {
            var l3 = l1.Count >= l2.Count ? l1.AddResult(l2) : l2.AddResult(l1);
            return l3;
        }

        public static List<int> AddResult(this List<int> list, List<int> l2)
        {
            //list.Reverse();
            //l2.Reverse();
            var listResult = new List<int>();
            var tmp = 0;
            var length2 = l2.Count;
            var length1 = list.Count;
            for (var i = 0; i < length2; i++)
            {
                var node = list[i] + l2[i] + tmp;
                if (node > 9)
                {
                    tmp = node / 10;
                    node = node % 10;
                }

                listResult.Add(node);
            }

            for (var i = length2; i < length1; i++)
            {
                var node = list[i] + tmp;
                if (node > 9)
                {
                    tmp = node / 10;
                    node = node % 10;
                }

                listResult.Add(node);
            }

            return listResult;
        }

    }


    //Definition for singly-linked list.

    public class ListNode
    {
        public int Val;
        public ListNode Next;
        private ListNode P;

        public ListNode(int x)
        {
            Val = x;
        }
        public ListNode(int[] xs)
        {
            P = new ListNode(0);
            var xx = new int[xs.Length-1];
            Val = xs[1];
            Next = P;
            Array.Copy(xs,1,xx,0,xx.Length);
            foreach (var i in xs)
            {
                P.Val = i;
                P.Next = new ListNode(0);
                P = P.Next;
            }
        }
    }

    public static class Solution
    {
        public static ListNode AddTwoNumbers(ListNode l1, ListNode l2)
        {
            var result = new ListNode(0);
            var p = result;
            var node = 0;
            while (l1.Next != null && l2.Next != null)
            {
                node = l1.Val + l2.Val + node;
                result.Val = node > 9 ? node % 10 : node;
                result = result.Next;
                node /= 10;
            }

            while (l1.Next != null)
            {
                node = l1.Val + node;
                result.Val = node > 9 ? node % 10 : node;
                result = result.Next;
                node /= 10;
            }

            while (l2.Next != null)
            {
                node = l2.Val + node;
                result.Val = node > 9 ? node % 10 : node;
                result = result.Next;
                node /= 10;
            }

            if (node != 0)
            {
                result.Val = node;
            }
            return p;
        }
    }
}
